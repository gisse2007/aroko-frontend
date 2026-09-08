// src/hooks/useCatalogo.js
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCatalogo } from "../services/catalogoService";
import { whenIdle, cancelIdle } from "../utils/idle";

const PAGE_SIZE = 8;

/**
 * Hook para el catálogo por categoría con paginación "Ver más".
 * @param {number|null} categoriaId - null = todos (sin filtro)
 */
export function useCatalogo(categoriaId) {
  const [productos,   setProductos]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);

  // previene doble llamada con la misma clave
  const lastKey = useRef(null);

  const loadPage = useCallback(async (catId, pageNum, append) => {
    const key = `${catId ?? "all"}-${pageNum}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    append ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const params = { page: pageNum, limit: PAGE_SIZE };
      if (catId) params.categoria_id = catId;

      const res = await fetchCatalogo(params);
      const items = res.products ?? [];

      setProductos((prev) => append ? [...prev, ...items] : items);
      setHasMore(res.pagination?.hasNextPage ?? false);
    } catch (err) {
      setError(err.message ?? "Error al cargar productos");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  // reinicia cuando cambia la categoría.
  // La carga se difiere a "idle" para no competir con el render del Hero
  // (mejora LCP/TBT); en la práctica requestIdleCallback dispara en <100ms
  // una vez libre el hilo, y el skeleton cubre el estado intermedio.
  useEffect(() => {
    lastKey.current = null;
    setPage(1);
    setProductos([]);
    const handle = whenIdle(() => loadPage(categoriaId, 1, false), 1200);
    return () => cancelIdle(handle);
  }, [categoriaId, loadPage]);

  const verMas = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(categoriaId, nextPage, true);
  }, [categoriaId, page, loadPage]);

  return { productos, loading, loadingMore, hasMore, error, verMas };
}
