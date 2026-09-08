import { FiAlertTriangle } from "react-icons/fi";
import { memo } from "react";
import styles from "./StockAlertCard.module.css";

export default memo(function StockAlertCard({ items = [], loading = false }) {
  const visible = items.slice(0, 6);
  const extra   = items.length - visible.length;

  return (
    <div className={styles.card}>
      <div className={styles.heading}>
        <FiAlertTriangle className={styles.alertIcon} />
        <h3>Alertas de stock bajo</h3>
      </div>
      {loading ? (
        <ul className={styles.list}>
          {[1,2,3].map((i) => <li key={i} className={styles.skeleton} />)}
        </ul>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Sin alertas de stock. ✅</p>
      ) : (
        <>
          <ul className={styles.list}>
            {visible.map((item) => {
              const pct = item.min > 0 ? Math.min((item.stock / item.min) * 100, 100) : 100;
              const critical = item.stock <= item.min * 0.4;
              return (
                <li key={`${item.tipo}-${item.id}`} className={styles.item}>
                  <div className={styles.itemTop}>
                    <div>
                      <span className={styles.name}>{item.name}</span>
                      <span className={styles.category}>
                        {item.category} · {item.tipo}
                      </span>
                    </div>
                    <span className={`${styles.qty} ${critical ? styles.critical : styles.warning}`}>
                      {item.stock} / {item.min}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${critical ? styles.barCritical : styles.barWarning}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {extra > 0 && (
            <p className={styles.more}>+{extra} más con stock bajo</p>
          )}
        </>
      )}
    </div>
  );
});
