import styles from "./Catalogo.module.css";

export default function CatalogoSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
      <div className={`${styles.imgWrap} ${styles.skeletonImg}`} />
      <div className={styles.body}>
        <div className={styles.skeletonLine} style={{ width: "40%", height: 12 }} />
        <div className={styles.skeletonLine} style={{ width: "75%", height: 16, marginTop: 6 }} />
        <div className={`${styles.cardFooter}`}>
          <div className={styles.skeletonLine} style={{ width: "30%", height: 20 }} />
          <div className={styles.skeletonLine} style={{ width: "38%", height: 38, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  ));
}
