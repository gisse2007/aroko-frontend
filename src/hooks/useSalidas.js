import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

export function useSalidas() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");
  const [fechaDesde, setFechaDesde]   = useState("");
  const [fechaHasta, setFechaHasta]   = useState("");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (fechaDesde)    params.desde  = fechaDesde;
      if (fechaHasta)    params.hasta  = fechaHasta;
      const { data: res } = await api.get("/salidas", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, fechaDesde, fechaHasta]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => data, [data]);

  const create = useCallback(async (values, detalle) => {
    const { data: res } = await api.post("/salidas", {
      empleado_id: Number(values.empleado_id),
      motivo:      values.motivo.trim(),
      detalle:     detalle.map((d) => ({
        insumo_id: d.insumo_id,
        cantidad:  parseFloat(d.cantidad),
      })),
    });
    if (mountedRef.current) setData((prev) => [res.data, ...prev]);
    return res;
  }, []);

  const anular = useCallback(async (id) => {
    const { data: res } = await api.patch(`/salidas/${id}/anular`);
    if (mountedRef.current) setData((prev) => prev.map((s) => (s.id_salida === id ? res.data : s)));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((s) => s.id_salida === id) ?? null, [data]);

  return {
    data, filtered, loading,
    search, setSearch,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    create, anular, findById, fetchAll,
  };
}
