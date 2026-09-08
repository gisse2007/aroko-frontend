import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta débito", "Tarjeta crédito", "Nequi", "Daviplata"];

export function useAbonos() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("");
  const [fechaDesde, setFechaDesde]       = useState("");
  const [fechaHasta, setFechaHasta]       = useState("");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (ventaId = null) => {
    setLoading(true);
    try {
      const params = {};
      if (ventaId)    params.venta_id = ventaId;
      if (fechaDesde) params.desde    = fechaDesde;
      if (fechaHasta) params.hasta    = fechaHasta;
      const { data: res } = await api.get("/abonos", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((a) => {
      const matchSearch = !q ||
        a.numero_venta?.toLowerCase().includes(q) ||
        a.cliente_nombre?.toLowerCase().includes(q);
      const matchEstado = !filterEstado || a.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [data, search, filterEstado]);

  const registrar = useCallback(async (values, ventaId) => {
    const { data: res } = await api.post("/abonos", {
      venta_id:    Number(ventaId),
      empleado_id: Number(values.empleado_id),
      valor:       parseFloat(values.valor_abono),
      metodo_pago: values.metodo_pago,
    });
    if (mountedRef.current) setData((prev) => [res.data, ...prev]);
    return res;
  }, []);

  const anular = useCallback(async (id) => {
    const { data: res } = await api.patch(`/abonos/${id}/anular`);
    if (mountedRef.current) setData((prev) => prev.map((a) => (a.id_abono === id ? res.data : a)));
    return res;
  }, []);

  const getVentaInfo = useCallback(async (ventaId) => {
    const { data: res } = await api.get(`/ventas/${ventaId}`);
    return res.data;
  }, []);

  const findById = useCallback((id) => data.find((a) => a.id_abono === id) ?? null, [data]);

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    registrar, anular, findById, fetchAll, getVentaInfo,
  };
}
