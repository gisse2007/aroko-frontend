import { useState, useEffect } from "react";
import { FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { useOrders } from "../../hooks/useOrders";
import styles from "./AdminOrders.module.css";

const STATUSES = ["Pendiente", "Confirmado", "En preparación", "Enviado", "Entregado", "Cancelado"];

const STATUS_CLS = {
  "Pendiente":       styles.statusPending,
  "Confirmado":      styles.statusConfirmed,
  "En preparación":  styles.statusPrep,
  "Enviado":         styles.statusShipped,
  "Entregado":       styles.statusDone,
  "Cancelado":       styles.statusCancelled,
};

export default function AdminOrders() {
  const { loading, fetchAllOrders, updateStatus } = useOrders();
  const [orders,   setOrders]   = useState([]);
  const [updating, setUpdating] = useState(null);
  const [error,    setError]    = useState("");

  const load = () => {
    setError("");
    fetchAllOrders()
      .then((data) => {
        setOrders(data);
        if (data.length === 0) {
          // Ayuda a depurar: si llegó vacío pero sin error, lo indicamos
          console.info("[AdminOrders] El endpoint respondió OK pero retornó 0 órdenes.");
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Error desconocido";
        const status = err?.response?.status ?? "sin status";
        console.error(`[AdminOrders] Error ${status}:`, msg, err);
        setError(`Error ${status}: ${msg}`);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await updateStatus(id, status);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch {
      setError("Error al actualizar el estado.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Órdenes del catálogo</h2>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          <FiRefreshCw className={loading ? styles.spin : ""} /> Actualizar
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading && orders.length === 0 ? (
        <div className={styles.skeletons}>
          {[1,2,3,4].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : orders.length === 0 ? (
        <p className={styles.empty}>No hay órdenes registradas.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Productos</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.orderId}>#{String(o.id).slice(0, 8)}</td>
                  <td>
                    <div className={styles.clienteInfo}>
                      <span className={styles.clienteNombre}>{o.user_name ?? o.nombre ?? '—'}</span>
                      {(o.user_email ?? o.user?.email) && (
                        <span className={styles.clienteEmail}>{o.user_email ?? o.user?.email}</span>
                      )}
                    </div>
                  </td>
                  <td>{o.created_at?.split("T")[0] ?? "—"}</td>
                  <td className={styles.total}>${Number(o.total || 0).toLocaleString("es-CO")}</td>
                  <td>
                    <select
                      className={`${styles.statusSelect} ${STATUS_CLS[o.status] ?? ""}`}
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value)}
                      disabled={updating === o.id}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    {o.payment_proof ? (
                      <a href={o.payment_proof} target="_blank" rel="noreferrer" className={styles.proofLink}>
                        <FiExternalLink /> Ver
                      </a>
                    ) : (
                      <span className={styles.noProof}>—</span>
                    )}
                  </td>
                  <td>
                    {(o.items ?? o.order_items ?? []).length > 0 ? (
                      <ul className={styles.itemsList}>
                        {(o.items ?? o.order_items).map((item, idx) => (
                          <li key={idx}>{item.name ?? item.nombre} × {item.quantity ?? item.cantidad}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.noProof}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
