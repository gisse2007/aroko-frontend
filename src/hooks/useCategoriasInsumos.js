import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axios";

export const PAGE_SIZE = 6;

export function useCategoriasInsumos() {
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [filterEstado, setFilterEstado]   = useState("ACTIVO");
  const [sortBy, setSortBy]               = useState("nombre");
  const [sortDir, setSortDir]             = useState("asc");
  const [page, setPage]                   = useState(1);

  /**
   * Consulta el listado completo de categorías de insumos.
   * No se envía filtro de estado al servidor: las categorías INACTIVO
   * también deben aparecer en el listado; el filtrado por estado se
   * aplica localmente desde `filterEstado`.
   */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/categorias-insumos");
      setData(Array.isArray(res?.data) ? res.data : []);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
    resetPage();
  };

  /** Garantiza que una categoría exista en el listado local tras una mutación. */
  const asegurarEnListado = useCallback((registro) => {
    if (!registro || registro.id_categoria == null) return;
    setData((prev) =>
      prev.some((c) => c.id_categoria === registro.id_categoria) ? prev : [registro, ...prev]
    );
  }, []);

  /* ── CRUD ── */
  const create = async (values) => {
    const { data: res } = await api.post("/categorias-insumos", { nombre: values.nombre.trim() });
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  };

  const update = async (id, values) => {
    const { data: res } = await api.put(`/categorias-insumos/${id}`, { nombre: values.nombre.trim() });
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  };

  const toggleEstado = async (id) => {
    const { data: res } = await api.patch(`/categorias-insumos/${id}/estado`);
    await fetchAll();
    asegurarEnListado(res?.data);
    return res ?? {};
  };

  /**
   * Elimina una categoría. Validación previa: no se permite eliminar
   * si la categoría tiene insumos asociados (se retorna un error con
   * mensaje de validación).
   */
  const softDelete = async (id) => {
    const categoria = data.find((c) => c.id_categoria === id);
    const asociados = Number(categoria?.total_insumos ?? 0);

    if (asociados > 0) {
      const err = new Error(
        `No se puede eliminar la categoría "${categoria?.nombre ?? ""}" porque tiene ${asociados} insumo(s) asociado(s).`
      );
      err.validacion = true;
      throw err;
    }

    const { data: res } = await api.delete(`/categorias-insumos/${id}`);
    setData((prev) => prev.filter((c) => c.id_categoria !== id));
    return res ?? {};
  };

  return {
    data, filtered, paginated, loading,
    search, setSearch,
    filterEstado, setFilterEstado,
    sortBy, sortDir, toggleSort,
    page, setPage, totalPages, resetPage,
    create, update, toggleEstado, softDelete, fetchAll,
  };
}