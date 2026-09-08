import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "../api/axios";

export const ESTADOS_DOMICILIO = [
  "PENDIENTE",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

export const ESTADOS_LABEL = {
  PENDIENTE: "Pendiente",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const PAGE_SIZE = 6;

export function useDomicilios() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (search.trim()) params.search = search.trim();

      if (filterEstado) params.estado = filterEstado;

      const { data: res } = await api.get("/domicilios", {
        params,
      });

      if (mountedRef.current) setData(res.data ?? []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [search, filterEstado]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return data.filter((d) => {
      const numeroPedido = String(
        d.numero_pedido ?? ""
      ).toLowerCase();

      const coincideBusqueda =
        !q ||
        d.direccion?.toLowerCase().includes(q) ||
        d.cliente_nombre?.toLowerCase().includes(q) ||
        numeroPedido.includes(q) ||
        String(d.id_domicilio).includes(q);

      const coincideEstado =
        !filterEstado ||
        d.estado === filterEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [data, search, filterEstado]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const resetPage = () => setPage(1);

  function buildPayload(values) {
    return {
      venta_id:    values.venta_id    ? Number(values.venta_id)    : null,
      cliente_id:  values.cliente_id  ? Number(values.cliente_id)  : null,
      empleado_id: values.empleado_id ? Number(values.empleado_id) : null,
      barrio:      values.barrio?.trim()     ?? "",
      direccion:   values.direccion?.trim()  ?? "",
      referencias: values.referencias?.trim() ?? "",
    };
  }

  const create = useCallback(async (values) => {
    const { data: res } = await api.post(
      "/domicilios",
      buildPayload(values)
    );

    const nuevo = res.data ?? res;

    if (mountedRef.current) setData((prev) => [nuevo, ...prev]);

    return res;
  }, []);

  const update = useCallback(async (id, values) => {
    const { data: res } = await api.put(
      `/domicilios/${id}`,
      buildPayload(values)
    );

    const actualizado = res.data ?? res;

    if (mountedRef.current) setData((prev) =>
      prev.map((d) =>
        d.id_domicilio === id ? actualizado : d
      )
    );

    return res;
  }, []);

  const cambiarEstado = useCallback(async (id, estado) => {
    const { data: res } = await api.patch(
      `/domicilios/${id}/estado`,
      {
        estado,
      }
    );

    const actualizado = res.data ?? res;

    if (mountedRef.current) setData((prev) =>
      prev.map((d) =>
        d.id_domicilio === id ? actualizado : d
      )
    );

    return res;
  }, []);

  const cancelar = useCallback(async (id) => {
    const { data: res } = await api.patch(
      `/domicilios/${id}/cancelar`
    );

    const actualizado = res.data ?? res;

    if (mountedRef.current) setData((prev) =>
      prev.map((d) =>
        d.id_domicilio === id ? actualizado : d
      )
    );

    return res;
  }, []);

  const findById = useCallback((id) =>
    data.find((d) => d.id_domicilio === id) ?? null,
    [data]
  );

  return {
    data,
    filtered,
    paginated,
    loading,

    search,
    setSearch,

    filterEstado,
    setFilterEstado,

    page,
    setPage,

    totalPages,

    resetPage,

    fetchAll,

    create,

    update,

    cambiarEstado,

    cancelar,

    findById,
  };
}
