import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const TIPOS_DOCUMENTO_EMP = ["CC", "CE", "NIT", "Pasaporte", "TI"];

export function useEmpleados() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("ACTIVO");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/empleados");
      if (mountedRef.current) setData(Array.isArray(res?.data) ? res.data : []);
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
    return data.filter((e) => {
      const matchSearch =
        !q ||
        [e.nombre, e.documento, e.usuario_correo, e.cargo, e.area, e.email]
          .some((value) => String(value ?? "").toLowerCase().includes(q));
      const matchEstado = !filterEstado || e.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [data, search, filterEstado]);

  /* ── CRUD ── */
  const create = useCallback(async (values) => {
    const { data: res } = await api.post("/empleados", {
      rol_id:         Number(values.rol_id),
      correo_acceso:  values.correo_acceso.trim(),
      nombre:         values.nombre.trim(),
      tipo_documento: values.tipo_documento,
      documento:      values.documento.trim(),
      telefono:       (values.telefono || "").trim(),
      cargo:          (values.cargo || "").trim(),
      area:           (values.area || "").trim(),
      direccion:      (values.direccion || "").trim(),
      email:          (values.email || "").trim(),
      salario:        values.salario ? Number(values.salario) : null,
      fecha_ingreso:  values.fecha_ingreso || null,
    });
    if (mountedRef.current) setData((prev) => [...prev, res.data]);
    return res;
  }, []);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(`/empleados/${id}`, {
      rol_id:         values.rol_id !== undefined && values.rol_id !== null && values.rol_id !== ""
        ? Number(values.rol_id)
        : null,
      nombre:         values.nombre.trim(),
      tipo_documento: values.tipo_documento,
      documento:      values.documento.trim(),
      telefono:       (values.telefono || "").trim(),
      cargo:          (values.cargo || "").trim(),
      area:           (values.area || "").trim(),
      direccion:      (values.direccion || "").trim(),
      email:          (values.email || "").trim(),
      salario:        values.salario ? Number(values.salario) : null,
      fecha_ingreso:  values.fecha_ingreso || null,
    });
    if (mountedRef.current) setData((prev) => prev.map((e) => (e.id_empleado === id ? res.data : e)));
    return res;
  }, []);

  const toggleEstado = useCallback(async (id) => {
    const { data: res } = await api.patch(`/empleados/${id}/estado`);
    if (mountedRef.current) setData((prev) => prev.map((e) => (e.id_empleado === id ? res.data : e)));
    return res;
  }, []);

  const softDelete = useCallback(async (id) => {
    const { data: res } = await api.delete(`/empleados/${id}`);
    if (mountedRef.current) setData((prev) => prev.filter((e) => e.id_empleado !== id));
    return res;
  }, []);

  const findById = useCallback((id) => data.find((e) => e.id_empleado === id) ?? null, [data]);

  const fetchById = useCallback(async (id) => {
    const { data: res } = await api.get(`/empleados/${id}`);
    return res?.data ?? res;
  }, []);

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    create, update, toggleEstado, softDelete, findById, fetchById, fetchAll,
  };
}
