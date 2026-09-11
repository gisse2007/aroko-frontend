import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

const normalizeEstado = (value) => {
  const estado = String(value ?? "").trim().toUpperCase();
  if (["ACTIVO", "A", "1", "TRUE", "VIGENTE", "HABILITADO"].includes(estado)) return "ACTIVO";
  if (["INACTIVO", "I", "0", "FALSE", "DESHABILITADO", "ELIMINADO", "BORRADO", "DELETED", "INACTIVE"].includes(estado)) return "INACTIVO";
  return estado || "ACTIVO";
};

const isDeletedInsumo = (insumo) => {
  if (!insumo) return false;
  const deletedValues = [insumo.eliminado, insumo.deleted, insumo.borrado, insumo.is_deleted];
  return deletedValues.some((value) => value === true || value === 1 || String(value).toLowerCase() === "true");
};

const sanitizeInsumos = (rows = []) =>
  rows.filter((insumo) => !isDeletedInsumo(insumo));

export function useInsumos() {
  const [data, setData]                     = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState("");
  const [filterUnidad, setFilterUnidad]     = useState("");
  const [filterEstado, setFilterEstado]     = useState("ACTIVO");
  const [page, setPage]                     = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterUnidad)  params.unidad = filterUnidad;
      if (filterEstado)  params.estado = filterEstado;
      const { data: res } = await api.get("/insumos", { params });
      if (mountedRef.current) setData(sanitizeInsumos(Array.isArray(res?.data) ? res.data : []));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, filterUnidad, filterEstado]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  /* ── Filtrado local por estado ── */
  const filtered = useMemo(() => {
    const rows = data.filter((i) => !isDeletedInsumo(i));
    if (!filterEstado) return rows;
    return rows.filter((i) => normalizeEstado(i.estado) === filterEstado);
  }, [data, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);

  const stockBajoCount = useMemo(
    () => data.filter((i) => !isDeletedInsumo(i) && i.stock_bajo).length,
    [data]
  );

  const unidades = useMemo(
    () => [...new Set(data.filter((i) => !isDeletedInsumo(i)).map((i) => i.unidad_medida))].sort(),
    [data]
  );

  const asegurarEnListado = useCallback((registro, campoId = "id_insumo") => {
    if (!registro || registro[campoId] == null || isDeletedInsumo(registro)) return;
    setData((prev) => {
      const sinEliminados = prev.filter((i) => !isDeletedInsumo(i));
      return sinEliminados.some((i) => i[campoId] === registro[campoId])
        ? sinEliminados
        : [registro, ...sinEliminados];
    });
  }, []);

  /* ── CRUD ── */
  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/insumos", {
      nombre_insumo:   values.nombre_insumo.trim(),
      categoria_id:    Number(values.categoria_id),
      unidad_medida:   values.unidad_medida,
      presentacion_nombre: values.presentacion_nombre?.trim() || null,
      presentacion_contenido: Number.isFinite(Number(values.presentacion_contenido))
        ? parseFloat(values.presentacion_contenido)
        : null,
      stock_actual:    parseFloat(values.stock_actual) || 0,
      stock_minimo:    parseFloat(values.stock_minimo) || 0,
      stock_minimo_unidad: values.stock_minimo_unidad || "unidad_medida",
      precio_unitario: parseFloat(values.precio_unitario) || 0,
    });
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  }, [fetchAll, asegurarEnListado]);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(`/insumos/${id}`, {
      nombre_insumo:   values.nombre_insumo.trim(),
      categoria_id:    Number(values.categoria_id),
      unidad_medida:   values.unidad_medida,
      presentacion_nombre: values.presentacion_nombre?.trim() || null,
      presentacion_contenido: Number.isFinite(Number(values.presentacion_contenido))
        ? parseFloat(values.presentacion_contenido)
        : null,
      stock_actual:    parseFloat(values.stock_actual) || 0,
      stock_minimo:    parseFloat(values.stock_minimo) || 0,
      stock_minimo_unidad: values.stock_minimo_unidad || "unidad_medida",
      precio_unitario: parseFloat(values.precio_unitario) || 0,
    });
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  }, [fetchAll, asegurarEnListado]);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/insumos/${id}/estado`);
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  }, [fetchAll, asegurarEnListado]);

  const softDelete = useCallback(async (id) => {
    const { data: res } = await api.delete(`/insumos/${id}`);
    setData((prev) => prev.filter((i) => i.id_insumo !== id));
    await fetchAll();
    return res ?? {};
  }, [fetchAll]);

  const findById = useCallback((id) => data.find((i) => i.id_insumo === id) ?? null, [data]);

  return {
    data, filtered, paginated, loading,
    search, setSearch,
    filterUnidad, setFilterUnidad,
    filterEstado, setFilterEstado,
    page, setPage, totalPages, resetPage,
    stockBajoCount, unidades,
    create, update, toggleEstado, softDelete, findById, fetchAll,
  };
}
