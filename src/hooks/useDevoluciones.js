import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

export function useDevoluciones() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterEstado) params.estado = filterEstado;
      if (fechaDesde) params.desde = fechaDesde;
      if (fechaHasta) params.hasta = fechaHasta;
      const { data: res } = await api.get("/devoluciones", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, filterEstado, fechaDesde, fechaHasta]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      const target = String(d.numero_pedido ?? d.pedido_id ?? d.id ?? "").toLowerCase();
      const matchSearch = !q || target.includes(q) || d.motivo?.toLowerCase().includes(q);
      const matchEstado = !filterEstado || d.estado === filterEstado;
      const matchDesde = !fechaDesde || d.fecha >= fechaDesde;
      const matchHasta = !fechaHasta || d.fecha <= fechaHasta;
      return matchSearch && matchEstado && matchDesde && matchHasta;
    });
  }, [data, search, filterEstado, fechaDesde, fechaHasta]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = () => setPage(1);

  const create = useCallback(async (values, detalle) => {
    const { data: res } = await api.post("/devoluciones", {
      pedido_id: Number(values.pedido_id),
      empleado_id: Number(values.empleado_id),
      fecha: values.fecha,
      motivo: values.motivo?.trim() ?? "",
      detalle: detalle.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio: item.precio,
      })),
    });
    if (mountedRef.current) setData((prev) => [res.data, ...prev]);
    return res;
  }, []);

  const anular = useCallback(async (id) => {
    const { data: res } = await api.patch(`/devoluciones/${id}/anular`);
    if (mountedRef.current) setData((prev) => prev.map((d) => (d.id === id ? res.data : d)));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((d) => d.id === id) ?? null, [data]);

  return {
    data,
    filtered,
    paginated,
    loading,
    search,
    setSearch,
    filterEstado,
    setFilterEstado,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    page,
    setPage,
    totalPages,
    resetPage,
    fetchAll,
    create,
    anular,
    findById,
  };
}
