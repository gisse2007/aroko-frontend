import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";

const POLL_MS = 60000;

export function useNotificaciones() {
  const [data, setData]         = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading]   = useState(true);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const { data: res } = await api.get("/notificaciones/mias");
      if (!mountedRef.current) return;
      setData(Array.isArray(res?.data) ? res.data : []);
      setNoLeidas(res?.no_leidas ?? 0);
    } catch {
      // Si el token ya no es válido el interceptor global se encarga del
      // logout; aquí simplemente no actualizamos la lista.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    const interval = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchAll]);

  const marcarLeida = useCallback(async (id_notificacion) => {
    setData((prev) => prev.map((n) => (n.id_notificacion === id_notificacion ? { ...n, leida: true } : n)));
    setNoLeidas((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/notificaciones/${id_notificacion}/leida`);
    } catch {
      fetchAll();
    }
  }, [fetchAll]);

  const marcarTodasLeidas = useCallback(async () => {
    setData((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await api.patch("/notificaciones/marcar-todas-leidas");
    } catch {
      fetchAll();
    }
  }, [fetchAll]);

  return { data, noLeidas, loading, fetchAll, marcarLeida, marcarTodasLeidas };
}
