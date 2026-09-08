import { memo } from "react";
import styles from "./TopProductsCard.module.css";

export default memo(function TopProductsCard({ products = [], loading = false }) {
  const top5 = products.slice(0, 5);
  const maxSold = top5.length ? Math.max(...top5.map((p) => Number(p.sold) || 0), 1) : 1;

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Productos más vendidos (mes actual)</h3>
      {loading ? (
        <div className={styles.list}>
          {[1,2,3,4,5].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : products.length === 0 ? (
        <p className={styles.empty}>Sin datos este mes.</p>
      ) : (
        <div className={styles.list}>
          {top5.map((p, i) => (
            <div key={p.id_producto ?? i} className={styles.row}>
              <span className={styles.rank}>#{i + 1}</span>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.sold}>{p.sold} uds.</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(Number(p.sold) / maxSold) * 100}%` }} />
                </div>
                <span className={styles.stock}>
                  Stock: <b style={{ color: Number(p.stock) < 10 ? "#d93025" : "#1a9e5c" }}>{p.stock}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
