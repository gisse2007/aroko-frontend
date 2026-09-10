import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";
import { normalizeProduct } from "../utils/image";

export const STOCK_MINIMO = 5;

export function useProductos() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterEstado, setFilterEstado] = useState("ACTIVO");
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {

    setLoading(true);

    try {

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterCategoria) {
        params.categoria_id = filterCategoria;
      }

      const { data: res } = await api.get(
        "/productos",
        { params }
      );

      const items = (res.data ?? []).map((p) => normalizeProduct(p));
      if (mountedRef.current) setData(items);

    } finally {

      setLoading(false);

    }

  }, [search, filterCategoria]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {

    if (!filterEstado) {
      return data;
    }

    return data.filter(
      (p) => p.estado === filterEstado
    );

  }, [data, filterEstado]);

  const stockBajoCount = useMemo(
    () => data.filter((p) => p.stock_bajo).length,
    [data]
  );

  const create = useCallback(async (values) => {
    const formData = values;

    const { data: res } = await api.post(
      "/productos",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const item = normalizeProduct(res.data);
    if (mountedRef.current) setData((prev) => [
      ...prev,
      item
    ]);

    return res;
  }, []);

  const update = useCallback(async (id, values) => {
    const formData = values;

    const { data: res } = await api.put(
      `/productos/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const item = normalizeProduct(res.data);
    if (mountedRef.current) setData((prev) =>
      prev.map((p) =>
        p.id_producto === id
          ? item
          : p
      )
    );

    return res;
  }, []);

  const toggleEstado = useCallback(async (id) => {

    const { data: res } = await api.patch(
      `/productos/${id}/estado`
    );

    if (mountedRef.current) setData((prev) =>
      prev.map((p) =>
        p.id_producto === id
          ? normalizeProduct(res.data)
          : p
      )
    );

    return res;
  }, []);

  const softDelete = useCallback(async (id) => {

    const { data: res } = await api.delete(
      `/productos/${id}`
    );

    if (mountedRef.current) setData((prev) =>
      prev.filter(
        (p) => p.id_producto !== id
      )
    );

    return res;
  }, []);

  const findById = useCallback((id) =>
    data.find(
      (p) => p.id_producto === id
    ) ?? null,
    [data]
  );

  return {

    data,
    filtered,
    loading,

    search,
    setSearch,

    filterCategoria,
    setFilterCategoria,

    filterEstado,
    setFilterEstado,

    stockBajoCount,

    create,
    update,
    toggleEstado,
    softDelete,
    findById,
    fetchAll,
  };
}
