import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

export function useCompras() {
  const [data, setData]                       = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [search, setSearch]                   = useState("");
  const [filterProveedor, setFilterProveedor] = useState("");
  const [fechaDesde, setFechaDesde]           = useState("");
  const [fechaHasta, setFechaHasta]           = useState("");
  const [page, setPage]                       = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde && fechaHasta) { params.desde = fechaDesde; params.hasta = fechaHasta; }
      else if (search.trim())       { params.search = search.trim(); }
      if (filterProveedor)          { params.proveedor_id = filterProveedor; }

      const { data: res } = await api.get("/compras", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, filterProveedor, fechaDesde, fechaHasta]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  /* ── Filtrado local adicional ── */
  const filtered = useMemo(() => data, [data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);

  /* ── Crear (multipart/form-data para foto opcional) ── */
  const create = useCallback(async (values, detalle, fotoFile) => {
    const fd = new FormData();
    fd.append("proveedor_id",    values.proveedor_id);
    fd.append("empleado_id",     values.empleado_id);
    fd.append("numero_factura",  values.numero_factura);
    fd.append("iva",             values.iva ?? 19);
    fd.append("detalle",         JSON.stringify(detalle));
    if (fotoFile) fd.append("foto_comprobante", fotoFile);

    const { data: res } = await api.post("/compras", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (mountedRef.current) setData((prev) => [res.data, ...prev]);
    return res;
  }, []);

  /* ── Anular ── */
  const anular = useCallback(async (id) => {
    const { data: res } = await api.patch(`/compras/${id}/anular`);
    if (mountedRef.current) setData((prev) => prev.map((c) => (c.id_compra === id ? res.data : c)));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((c) => c.id_compra === id) ?? null, [data]);

  return {
    data, filtered, paginated, loading,
    search, setSearch,
    filterProveedor, setFilterProveedor,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    page, setPage, totalPages, resetPage,
    create, anular, findById, fetchAll,
  };
}
