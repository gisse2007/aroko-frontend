// src/hooks/useCatalogoBusqueda.js
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchCatalogo } from "../services/catalogoService";

const PAGE_SIZE   = 8;
const DEBOUNCE_MS = 300;

export function useCatalogoBusqueda() {
  const [query,      setQuery]      = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  // order_by: recientes | precio_asc | precio_desc | mas_vendidos
  const [orderBy,    setOrderBy]    = useState("");

  const [resultados, setResultados] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);

  const timerRef    = useRef(null);
  const activeRef   = useRef(null);

  const doSearch = useCallback(async (params, append = false) => {
    const key = JSON.stringify(params);
    activeRef.current = key;

    append ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const res = await fetchCatalogo(params);
      if (activeRef.current !== key) return;

      const items = res.products ?? [];
      setResultados((prev) => append ? [...prev, ...items] : items);
      setPagination(res.pagination ?? null);
    } catch (err) {
      if (activeRef.current !== key) return;
      setError(err.message ?? "Error en la búsqueda");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  // debounce al cambiar filtros — siempre desde página 1
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed && !categoriaId && !orderBy) {
      setResultados([]);
      setPagination(null);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPage(1);
      const params = { page: 1, limit: PAGE_SIZE };
      if (trimmed)     params.q            = trimmed;
      if (categoriaId) params.categoria_id = categoriaId;
      if (orderBy)     params.order_by     = orderBy;
      doSearch(params, false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [query, categoriaId, orderBy, doSearch]);

  const verMas = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    const trimmed = query.trim();
    const params  = { page: nextPage, limit: PAGE_SIZE };
    if (trimmed)     params.q            = trimmed;
    if (categoriaId) params.categoria_id = categoriaId;
    if (orderBy)     params.order_by     = orderBy;
    doSearch(params, true);
  }, [page, query, categoriaId, orderBy, doSearch]);

  return {
    query,       setQuery,
    categoriaId, setCategoriaId,
    orderBy,     setOrderBy,
    resultados,
    total:       pagination?.totalProducts ?? 0,
    hasMore:     pagination?.hasNextPage   ?? false,
    loading,     loadingMore,
    error,       verMas,
    isSearching: !!(query.trim() || categoriaId || orderBy),
  };
}
