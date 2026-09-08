// src/services/catalogoService.js
import api from "../api/axios";
import { normalizeProduct } from "../utils/image";

const BASE = "/productos/search";
const TTL = 60 * 1000;          // 1 minuto de frescura
const MAX_ENTRIES = 30;         // tope del cache en memoria

const _cache    = new Map();    // key -> { t, res }
const _inflight = new Map();    // key -> Promise (dedupe)

function buildKey({ q, categoria_id, order_by, page, limit }) {
  return JSON.stringify({
    q: q ?? "",
    categoria_id: categoria_id ?? "",
    order_by: order_by ?? "",
    page,
    limit,
  });
}

function trimCache() {
  if (_cache.size <= MAX_ENTRIES) return;
  // Evicción FIFO simple del más antiguo
  const oldest = _cache.keys().next().value;
  if (oldest !== undefined) _cache.delete(oldest);
}

/**
 * GET /api/productos/search
 * Usado tanto por el catálogo por categoría como por la búsqueda.
 * - Deduplica peticiones idénticas en vuelo.
 * - Sirve respuestas desde cache durante el TTL.
 * @param {{ q?, categoria_id?, order_by?, page?, limit? }} params
 * @returns {{ products: [], pagination: {} }}
 */
export async function fetchCatalogo(params = {}) {
  const { q, categoria_id, order_by, page = 1, limit = 8 } = params;
  const key = buildKey({ q, categoria_id, order_by, page, limit });

  const hit = _cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.res;

  const pending = _inflight.get(key);
  if (pending) return pending;

  const qp = { page, limit };
  if (q)            qp.q            = q;
  if (categoria_id) qp.categoria_id = categoria_id;
  if (order_by)     qp.order_by     = order_by;

  const request = api.get(BASE, { params: qp })
    .then(({ data: res }) => {
      // normalize product images
      if (res && Array.isArray(res.products)) {
        res.products = res.products.map((p) => normalizeProduct(p));
      }
      _cache.set(key, { t: Date.now(), res });
      trimCache();
      _inflight.delete(key);
      return res; // { success, products, pagination }
    })
    .catch((err) => {
      _inflight.delete(key);
      throw err;
    });

  _inflight.set(key, request);
  return request;
}