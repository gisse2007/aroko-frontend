import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export function useVentas() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("");
  const [fechaDesde, setFechaDesde]       = useState("");
  const [fechaHasta, setFechaHasta]       = useState("");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde && fechaHasta) { params.desde = fechaDesde; params.hasta = fechaHasta; }
      else if (filterEstado)        { params.estado = filterEstado; }
      else if (q.trim())            { params.search = q.trim(); }
      const { data: res } = await api.get("/ventas", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } catch {
      if (mountedRef.current) setData([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fechaDesde, fechaHasta, filterEstado]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => data, [data]);

  const totalIngresos = useMemo(
    () => data.filter((v) => v.estado === "REGISTRADA").reduce((a, v) => a + Number(v.total), 0),
    [data]
  );

  const registrar = useCallback(async (values, detalle) => {
    const { data: res } = await api.post("/ventas", {
      cliente_id:  Number(values.cliente_id),
      empleado_id: Number(values.empleado_id),
      pedido_id:   values.pedido_id ? Number(values.pedido_id) : null,
      fecha_venta: values.fecha_venta || null,
      detalle:     detalle.map((d) => ({
        producto_id: d.producto_id,
        cantidad:    d.cantidad,
        precio:      d.precio,
      })),
    });
    if (mountedRef.current) setData((prev) => [res.data, ...prev]);
    return res;
  }, []);

  const anular = useCallback(async (id, motivo_anulacion) => {
    const { data: res } = await api.patch(`/ventas/${id}/anular`, { motivo_anulacion });
    if (mountedRef.current) setData((prev) => prev.map((v) => (v.id_venta === id ? res.data : v)));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((v) => v.id_venta === id) ?? null, [data]);

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    totalIngresos,
    registrar, anular, findById, fetchAll,
  };
}
