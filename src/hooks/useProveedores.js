import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

export function useProveedores() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("ACTIVO");
  const [page, setPage]                   = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const { data: res } = await api.get("/proveedores", { params });
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    if (!filterEstado) return data;
    return data.filter((p) => p.estado === filterEstado);
  }, [data, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);

  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/proveedores", {
      empleado_id:      Number(values.empleado_id),
      nombre_proveedor: values.nombre_proveedor.trim(),
      direccion:        (values.direccion  || "").trim(),
      telefono:         (values.telefono   || "").trim(),
      email:            (values.email      || "").trim(),
    });
    if (mountedRef.current) setData((prev) => [...prev, res.data]);
    return res;
  }, []);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(`/proveedores/${id}`, {
      empleado_id:      Number(values.empleado_id),
      nombre_proveedor: values.nombre_proveedor.trim(),
      direccion:        (values.direccion  || "").trim(),
      telefono:         (values.telefono   || "").trim(),
      email:            (values.email      || "").trim(),
    });
    if (mountedRef.current) setData((prev) => prev.map((p) => (p.id_proveedor === id ? res.data : p)));
    return res;
  }, []);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/proveedores/${id}/estado`);
    if (mountedRef.current) setData((prev) => prev.map((p) => (p.id_proveedor === id ? res.data : p)));
    return res;
  }, []);

  const softDelete = useCallback(async (id) => {
    const { data: res } = await api.delete(`/proveedores/${id}`);
    if (mountedRef.current) setData((prev) => prev.filter((p) => p.id_proveedor !== id));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((p) => p.id_proveedor === id) ?? null, [data]);

  return {
    data, filtered, paginated, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    page, setPage, totalPages, resetPage,
    create, update, toggleEstado, softDelete, findById, fetchAll,
  };
}
