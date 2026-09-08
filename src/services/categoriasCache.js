// Cache en memoria + sessionStorage para evitar llamadas duplicadas
// a /categorias-productos (TTL 5 minutos).
import api from "../api/axios";

const CACHE_KEY = "aroko.categorias";
const TTL = 5 * 60 * 1000;

let _promise = null;
let _data    = null;

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.t || Date.now() - parsed.t > TTL || !Array.isArray(parsed.d)) return null;
    return parsed.d;
  } catch { return null; }
}

function writeSessionCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: data })); }
  catch { /* almacenamiento no disponible */ }
}

export function fetchCategoriasProductos() {
  if (_data) return Promise.resolve(_data);

  const cached = readSessionCache();
  if (cached) {
    _data = cached;
    return Promise.resolve(_data);
  }

  if (_promise) return _promise;

  _promise = api.get("/categorias-productos?all=true")
    .then(({ data: res }) => {
      _data    = res.data ?? [];
      _promise = null;
      writeSessionCache(_data);
      return _data;
    })
    .catch((err) => {
      _promise = null;
      throw err;
    });

  return _promise;
}