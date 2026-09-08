import { useState, memo } from "react";
import styles from "./KpiPeriodCard.module.css";

const PERIODS = ["semana", "mes", "año"];

export default memo(function KpiPeriodCard({ title, icon, data, loading = false }) {
  const [period, setPeriod] = useState("mes");
  const { value, change = "0%" } = data[period] ?? {};
  const positive = String(change).startsWith("+");

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.tabs}>
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`${styles.tab} ${period === p ? styles.active : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.title}>{title}</p>
      <div className={styles.bottom}>
        {loading
          ? <span className={styles.skeleton} />
          : <span className={styles.value}>{value ?? "—"}</span>
        }
        <span className={`${styles.badge} ${positive ? styles.pos : styles.neg}`}>
          {change}
        </span>
      </div>
    </div>
  );
});
