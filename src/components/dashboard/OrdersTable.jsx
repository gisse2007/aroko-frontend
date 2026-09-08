import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OrdersTable.module.css";

const STATUS_CLASS = {
  ACTIVO:             styles.pending,
  EN_ESPERA_FECHA:    styles.transit,
  CON_FECHA_ASIGNADA: styles.transit,
  ACEPTADO:           styles.confirmed,
  ENTREGADO:          styles.delivered,
  RECHAZADO:          styles.cancelled,
  INACTIVO:           styles.cancelled,
};

const STATUS_LABEL = {
  ACTIVO: "Activo", EN_ESPERA_FECHA: "En espera", CON_FECHA_ASIGNADA: "Con fecha",
  ACEPTADO: "Aceptado", ENTREGADO: "Entregado", RECHAZADO: "Rechazado", INACTIVO: "Inactivo",
};

const PAGE_SIZE = 5;

export default memo(function OrdersTable({ orders = [], loading = false }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginated  = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.card}>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>Pedidos recientes</h3>
        <button className={styles.verBtn} onClick={() => navigate("/pedidos")}>Ver todos</button>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.skeletons}>
            {[1,2,3,4,5].map((i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>No hay pedidos registrados aún.</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr><th>N° Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th></tr>
              </thead>
              <tbody>
                {paginated.map((o, idx) => (
                  <tr key={o.id_pedido ?? o.id ?? idx}>
                    <td className={styles.orderId}>{o.numero_pedido ?? o.id}</td>
                    <td>{o.client ?? "—"}</td>
                    <td>{o.date?.split("T")[0] ?? "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_CLASS[o.status] ?? ""}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className={styles.total}>
                      ${Number(o.total || 0).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹
                </button>
                <span className={styles.pageInfo}>{page} / {totalPages}</span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
