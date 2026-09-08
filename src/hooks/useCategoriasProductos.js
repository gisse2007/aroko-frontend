import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axios";

export function useCategoriasProductos() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("");
  const [sortBy, setSortBy]               = useState("nombre");
  const [sortDir, setSortDir]             = useState("asc");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/categorias-productos");
      setData(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data]
      .filter((c) => {
        const matchNombre = !q || c.nombre.toLowerCase().includes(q);
        const matchEstado = !filterEstado || c.estado === filterEstado;
        return matchNombre && matchEstado;
      })
      .sort((a, b) => {
        const va = String(a[sortBy] ?? "").toLowerCase();
        const vb = String(b[sortBy] ?? "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [data, search, filterEstado, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  /* ── CRUD ── */
  const create = async (values) => {
    const { data: res } = await api.post("/categorias-productos", { nombre: values.nombre.trim() });
    setData((prev) => [...prev, res.data]);
    return res;
  };

  const update = async (id, values) => {
    const { data: res } = await api.put(`/categorias-productos/${id}`, { nombre: values.nombre.trim() });
    setData((prev) => prev.map((c) => (c.id_categoria === id ? res.data : c)));
    return res;
  };

  const toggleEstado = async (id) => {
    const { data: res } = await api.patch(`/categorias-productos/${id}/estado`);
    setData((prev) => prev.map((c) => (c.id_categoria === id ? res.data : c)));
    return res;
  };

  const softDelete = async (id) => {
    const { data: res } = await api.delete(`/categorias-productos/${id}`);
    setData((prev) => prev.filter((c) => c.id_categoria !== id));
    return res;
  };

  const findById = (id) => data.find((c) => c.id_categoria === id) ?? null;

  return {
    data, filtered, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    sortBy, sortDir, toggleSort,
    create, update, toggleEstado, softDelete, findById, fetchAll,
  };
}
