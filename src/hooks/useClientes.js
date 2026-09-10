import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const TIPOS_DOCUMENTO = ["CC", "CE", "NIT", "Pasaporte", "TI"];

export function useClientes() {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterEstado, setFilterEstado] = useState("ACTIVO");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/clientes");
      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);


  const filtered = useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.nombre?.toLowerCase().includes(q) ||
        c.numero_documento?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    if (filterEstado) result = result.filter((c) => c.estado === filterEstado);
    return result;
  }, [data, search, filterEstado]);

  const findById = useCallback((id) => data.find((c) => c.id_cliente === id) ?? null, [data]);

  /* ── CRUD ── */
  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/clientes", {
      nombre:           values.nombre.trim(),
      tipo_documento:   values.tipo_documento,
      numero_documento: values.numero_documento.trim(),
      telefono:         values.telefono.trim(),
      email:            values.email.trim(),
      direccion:        values.direccion.trim(),
    });
    await fetchAll();
    return res;
  }, [fetchAll]);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(`/clientes/${id}`, {
      nombre:           values.nombre.trim(),
      tipo_documento:   values.tipo_documento,
      numero_documento: values.numero_documento.trim(),
      telefono:         values.telefono.trim(),
      email:            values.email.trim(),
      direccion:        values.direccion.trim(),
    });
    await fetchAll();
    return res;
  }, [fetchAll]);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/clientes/${id}/estado`);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const softDelete = useCallback(async (id) => {
    const { data: res } = await api.delete(`/clientes/${id}`);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const sincronizar = useCallback(async () => {
    const { data: res } = await api.post("/clientes/sincronizar");
    await fetchAll();
    return res;
  }, [fetchAll]);

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    findById, fetchAll,
    create, update, toggleEstado, softDelete, sincronizar,
  };
}
