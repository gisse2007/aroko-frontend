import { useState, useCallback } from "react";
import api from "../api/axios";

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const createOrder = useCallback(async (items, paymentProofFile, customerInfo) => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();

      // Campos planos del cliente
      fd.append("nombre",       customerInfo.nombre       ?? "");
      fd.append("email",        customerInfo.email        ?? "");
      fd.append("telefono",     customerInfo.telefono     ?? "");
      fd.append("direccion",    customerInfo.direccion    ?? "");
      fd.append("payment_type", customerInfo.payment_type ?? "COMPLETO");
      fd.append("paid_amount",  String(customerInfo.paid_amount ?? customerInfo.total ?? 0));
      if (customerInfo.fecha_entrega) fd.append("fecha_entrega", customerInfo.fecha_entrega);

      // Items como JSON string
      fd.append("items", JSON.stringify(
        items.map((i) => ({
          productId: Number(i.id_producto ?? i.id),
          quantity:  Number(i.qty),
        }))
      ));

      // Archivo comprobante
      if (paymentProofFile) fd.append("paymentProof", paymentProofFile);

      const { data } = await api.post("/orders", fd);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al procesar el pedido.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/orders/my-orders");
      // Normalizar: puede venir data.data, data.orders, o directamente un array
      const raw = data.data ?? data.orders ?? data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      return list;
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al cargar los pedidos.";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/admin/orders");
      return data.data ?? data ?? [];
    } catch (err) {
      const msg = err?.response?.data?.message || `Error ${err?.response?.status ?? "de red"} al cargar las órdenes.`;
      setError(msg);
      throw err; // propagar para que AdminOrders vea el status real
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
    return data;
  }, []);

  return { loading, error, createOrder, fetchMyOrders, fetchAllOrders, updateStatus };
}
