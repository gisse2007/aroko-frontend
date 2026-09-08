import { memo } from "react";
import styles from "./KpiCard.module.css";

export default memo(function KpiCard({ title, value, icon, accent = false }) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ""}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div>
        <p className={styles.title}>{title}</p>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
});
