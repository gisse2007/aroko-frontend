import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const ESTADOS_PRODUCCION = [
  "EN_PROCESO",
  "COMPLETADA",
  "ANULADA",
];

export const ESTADOS_PRODUCCION_LABEL = {
  EN_PROCESO: "En proceso",
  COMPLETADA: "Completada",
  ANULADA:    "Anulada",
};

export const FILTROS_ESTADO_PRODUCCION = [
  { value: "ACTIVOS",  label: "Activos"  },
  { value: "ANULADOS", label: "Anulados" },
];

export const PAGE_SIZE = 8;

const soloFecha = (v) => String(v ?? "").slice(0, 10);

export function useProduccion() {
  const [data,           setData]           = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [filterEstado,   setFilterEstado]   = useState("");
  const [filterEmpleado, setFilterEmpleado] = useState("");
  const [fechaDesde,     setFechaDesde]     = useState("");
  const [fechaHasta,     setFechaHasta]     = useState("");
  const [page,           setPage]           = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde)               params.desde    = fechaDesde;
      if (fechaHasta)               params.hasta    = fechaHasta;
      if (filterEstado === "ANULADOS") params.estado = "ANULADA";
      if (filterEmpleado.trim())    params.empleado = filterEmpleado.trim();
      const { data: res } = await api.get("/produccion", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fechaDesde, fechaHasta, filterEstado, filterEmpleado]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    let rows = data;

    if (fechaDesde) rows = rows.filter((r) => soloFecha(r.fecha) >= fechaDesde);
    if (fechaHasta) rows = rows.filter((r) => soloFecha(r.fecha) <= fechaHasta);

    if (filterEstado === "ACTIVOS")       rows = rows.filter((r) => r.estado !== "ANULADA");
    else if (filterEstado === "ANULADOS") rows = rows.filter((r) => r.estado === "ANULADA");

    const q = filterEmpleado.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        String(r.empleado_nombre ?? "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [data, fechaDesde, fechaHasta, filterEstado, filterEmpleado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);

  const registrar = useCallback(async (values, detalle) => {
    const { data: res } = await api.post("/produccion", {
      empleado_id:   Number(values.empleado_id),
      fecha:         values.fecha,
      observaciones: values.observaciones || "",
      detalle:       detalle.map((d) => ({
        producto_id: d.producto_id,
        cantidad:    parseFloat(d.cantidad),
      })),
    });
    await fetchAll();
    return res;
  }, [fetchAll]);

  const anular = useCallback(async (id, motivo_anulacion) => {
    const { data: res } = await api.patch(`/produccion/${id}/anular`, { motivo_anulacion });
    await fetchAll();
    return res;
  }, [fetchAll]);

  const cambiarEstado = useCallback(async (id, estado) => {
    const { data: res } = await api.patch(`/produccion/${id}/estado`, { estado });
    await fetchAll();
    return res;
  }, [fetchAll]);

  return {
    data, filtered, paginated, loading,
    filterEstado,   setFilterEstado,
    filterEmpleado, setFilterEmpleado,
    fechaDesde,     setFechaDesde,
    fechaHasta,     setFechaHasta,
    page, setPage, totalPages, resetPage,
    registrar, anular, cambiarEstado, fetchAll,
  };
}
