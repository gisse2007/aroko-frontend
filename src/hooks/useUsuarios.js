import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export function useUsuarios() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("");
  const [filterRol, setFilterRol]         = useState("");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/usuarios");
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
    const q = search.trim().toLowerCase();
    return data.filter((u) => {
      const matchSearch =
        !q ||
        u.correo?.toLowerCase().includes(q) ||
        u.rol_nombre?.toLowerCase().includes(q) ||
        u.nombre_usuario?.toLowerCase().includes(q);

      const matchEstado =
        !filterEstado ||
        (u.estado ?? "").toUpperCase() === filterEstado.toUpperCase();

      const rolId = u.id_rol ?? u.rol_id;
      const matchRol =
        !filterRol || String(rolId) === String(filterRol);

      return matchSearch && matchEstado && matchRol;
    });
  }, [data, search, filterEstado, filterRol]);

  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/usuarios", {
      correo:         values.correo.trim().toLowerCase(),
      rol_id:         Number(values.rol_id),
      nombre_usuario: (values.nombre_usuario || "").trim(),
      telefono:       (values.telefono || "").trim(),
    });
    await fetchAll();
    return res;
  }, [fetchAll]);

  const update = useCallback(async (id, values) => {
    const body = {
      correo:         values.correo.trim().toLowerCase(),
      rol_id:         Number(values.rol_id),
      nombre_usuario: (values.nombre_usuario || "").trim(),
      telefono:       (values.telefono || "").trim(),
      ...(values.estado ? { estado: values.estado } : {}),
    };
    const { data: res } = await api.put(`/usuarios/${id}`, body);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/usuarios/${id}/estado`);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const softDelete = useCallback(async (id) => {
    const { data: res } = await api.delete(`/usuarios/${id}`);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const findById = useCallback((id) => data.find((u) => u.id_usuario === id) ?? null, [data]);

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    filterRol, setFilterRol,
    create, update, toggleEstado, softDelete, findById, fetchAll,
  };
}
