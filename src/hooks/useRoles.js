import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export function normalizeRole(role = {}) {
  const rawEstado = role.estado ?? role.activo ?? role.active;
  let estado = "ACTIVO";

  if (typeof rawEstado === "boolean") {
    estado = rawEstado ? "ACTIVO" : "INACTIVO";
  } else if (rawEstado !== undefined && rawEstado !== null && rawEstado !== "") {
    const value = String(rawEstado).trim().toUpperCase();
    estado = ["ACTIVO", "ACTIVE", "1", "TRUE", "SI", "SÍ"].includes(value)
      ? "ACTIVO"
      : "INACTIVO";
  }

  return { ...role, estado };
}

export function useRoles() {
  const [roles, setRoles]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [filterEstado, setFilterEstado] = useState("ACTIVO");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterEstado)  params.estado = filterEstado;
      const { data: res } = await api.get("/roles", { params });
      const receivedRoles = Array.isArray(res?.data) ? res.data.map(normalizeRole) : [];
      const completeRoles = await Promise.all(receivedRoles.map(async (role) => {
        const count = role.total_permisos ?? role.permisos_count ?? role.cantidad_permisos ?? role.totalPermisos;
        if (count !== undefined && count !== null) {
          return { ...role, total_permisos: Number(count) || 0 };
        }
        if (Array.isArray(role.permisos)) {
          return { ...role, total_permisos: role.permisos.length };
        }
        try {
          const { data: permisosRes } = await api.get(`/roles/${role.id_rol}/permisos`);
          const permisos = Array.isArray(permisosRes?.data) ? permisosRes.data : [];
          return { ...role, total_permisos: permisos.length };
        } catch {
          return { ...role, total_permisos: 0 };
        }
      }));
      if (mountedRef.current) setRoles(completeRoles);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, filterEstado]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => roles, [roles]);

  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/roles", {
      nombre:      values.nombre.trim(),
      descripcion: values.descripcion.trim(),
    });
    if (mountedRef.current) setRoles((prev) => [...prev, normalizeRole(res.data)]);
    return res;
  }, []);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(`/roles/${id}`, {
      nombre:      values.nombre.trim(),
      descripcion: values.descripcion.trim(),
    });
    if (mountedRef.current) setRoles((prev) => prev.map((r) => (r.id_rol === id ? normalizeRole(res.data) : r)));
    return res;
  }, []);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/roles/${id}/estado`);
    await fetchAll();
    return res;
  }, [fetchAll]);

  const remove = useCallback(async (id) => {
    const { data: res } = await api.delete(`/roles/${id}`);
    if (mountedRef.current) setRoles((prev) => prev.filter((r) => r.id_rol !== id));
    return res;
  }, []);

  const findById = useCallback(
    (id) => roles.find((r) => r.id_rol === id) ?? null,
    [roles]
  );

  const fetchPermisosRol = useCallback(async (rolId) => {
    const { data: res } = await api.get(`/roles/${rolId}/permisos`);
    return Array.isArray(res.data) ? res.data : [];
  }, []);

  const fetchPermisosDisponibles = useCallback(async (rolId) => {
    const { data: res } = await api.get(`/roles/${rolId}/permisos/disponibles`);
    return Array.isArray(res.data) ? res.data : [];
  }, []);

  const agregarPermiso = useCallback(async (rolId, permisoId) => {
    const { data: res } = await api.post(`/roles/${rolId}/permisos`, { permiso_id: permisoId });
    return res;
  }, []);

  const eliminarPermiso = useCallback(async (rolId, permisoId) => {
    const { data: res } = await api.delete(`/roles/${rolId}/permisos/${permisoId}`);
    return res;
  }, []);

  return {
    roles, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    create, update, toggleEstado, remove, findById, fetchAll,
    fetchPermisosRol, fetchPermisosDisponibles,
    agregarPermiso, eliminarPermiso,
  };
}
