import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function CategoriaProductoDetalle({ categoria }) {
  if (!categoria) return <p className={styles.notFound}>Categoría no encontrada.</p>;

  const { nombre, estado, total_productos } = categoria;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activa : styles.inactiva}`}>
          {estado}
        </span>
        <span className={styles.identifier}>{nombre}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Nombre de la categoría" value={nombre}                    full />
        <Field label="Productos activos"      value={String(total_productos ?? 0)} />
        <Field label="Estado"                 value={estado} />
      </div>

    </div>
  );
}
