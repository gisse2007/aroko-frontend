import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const ESTADOS_PEDIDO = [
  "ACTIVO", "EN_ESPERA_FECHA", "CON_FECHA_ASIGNADA",
  "ACEPTADO", "RECHAZADO", "ENTREGADO", "INACTIVO",
];

export const ESTADOS_LABEL = {
  ACTIVO:              "Activo",
  EN_ESPERA_FECHA:     "En espera de fecha",
  CON_FECHA_ASIGNADA:  "Con fecha asignada",
  ACEPTADO:            "Aceptado",
  RECHAZADO:           "Rechazado",
  ENTREGADO:           "Entregado",
  INACTIVO:            "Inactivo",
};

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const PAGE_SIZE = 6;

export function usePedidos() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [searchError, setSearchError]     = useState("");
  const [filterEstado, setFilterEstado]   = useState("");
  const [fechaDesde, setFechaDesde]       = useState("");
  const [fechaHasta, setFechaHasta]       = useState("");
  const [page, setPage]                   = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde && fechaHasta) { params.desde = fechaDesde; params.hasta = fechaHasta; }
      else if (filterEstado)        { params.estado = filterEstado; }
      else if (q.trim())            { params.search = q.trim(); }
      const { data: res } = await api.get("/pedidos", { params });
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = useCallback(() => setPage(1), []);

  const buscar = useCallback((q) => {
    if (!q.trim()) { setSearchError("Debe ingresar un criterio de búsqueda."); return; }
    setSearchError("");
    setSearch(q);
    fetchAll(q);
    resetPage();
  }, [fetchAll, resetPage]);

  const clearSearch = useCallback(() => { setSearch(""); setSearchError(""); fetchAll(); resetPage(); }, [fetchAll, resetPage]);

  const asegurarEnListado = useCallback((registro) => {
    if (!registro || registro.id_pedido == null) return;
    setData((prev) =>
      prev.some((p) => p.id_pedido === registro.id_pedido) ? prev : [registro, ...prev]
    );
  }, []);

  /* ── CRUD ── */
  const create = useCallback(async (values, detalle) => {
    const { data: res } = await api.post("/pedidos", {
      cliente_id:    Number(values.cliente_id),
      empleado_id:   Number(values.empleado_id),
      fecha_entrega: values.fecha_entrega || null,
      observaciones: values.observaciones || "",
      origen:        "DASHBOARD",
      valor_pagado:  values.valor_pagado ? Number(values.valor_pagado) : 0,
      detalle:       detalle.map((d) => ({
        producto_id: d.producto_id,
        cantidad:    d.cantidad,
        precio:      d.precio,
      })),
    });
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  }, [fetchAll, asegurarEnListado]);

  const update = useCallback(async (id, values, detalle) => {
    const { data: res } = await api.put(`/pedidos/${id}`, {
      cliente_id:    Number(values.cliente_id),
      empleado_id:   Number(values.empleado_id),
      fecha_entrega: values.fecha_entrega || null,
      observaciones: values.observaciones || "",
      detalle:       detalle.map((d) => ({
        producto_id: d.producto_id,
        cantidad:    d.cantidad,
        precio:      d.precio,
      })),
    });
    if (res?.data) {
      if (mountedRef.current) setData((prev) => prev.map((p) => (p.id_pedido === id ? res.data : p)));
    } else {
      await fetchAll();
    }
    return res ?? {};
  }, [fetchAll]);

  const cambiarEstado = useCallback(async (id, estado) => {
    const { data: res } = await api.patch(`/pedidos/${id}/estado`, { estado });
    const pedidoActualizado = res?.data ?? res;
    if (pedidoActualizado.estado !== 'ACTIVO') {
      if (mountedRef.current) setData((prev) => prev.filter((p) => p.id_pedido !== id));
    } else {
      if (mountedRef.current) setData((prev) => prev.map((p) => (p.id_pedido === id ? pedidoActualizado : p)));
    }
    return res;
  }, []);

  const cancelar = useCallback(async (id) => {
    const { data: res } = await api.patch(`/pedidos/${id}/cancelar`);
    if (mountedRef.current) setData((prev) => prev.filter((p) => p.id_pedido !== id));
    return res ?? {};
  }, []);

  const findById = useCallback((id) => data.find((p) => p.id_pedido === id) ?? null, [data]);

  return {
    data, filtered, paginated, loading,
    search, setSearch, searchError, setSearchError,
    filterEstado, setFilterEstado,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    page, setPage, totalPages, resetPage,
    buscar, clearSearch,
    create, update, cambiarEstado, cancelar, findById, fetchAll,
  };
}
