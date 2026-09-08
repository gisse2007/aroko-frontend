import { FiAlertTriangle } from "react-icons/fi";
import styles from "../Detalle.module.css";

const Field = ({ label, value, full, highlight }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""} ${highlight ? styles.highlight : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${highlight ? styles.danger : ""}`}>
      {value ?? "—"}
    </span>
  </div>
);

export default function InsumoDetalle({ insumo }) {
  if (!insumo) return null;
  const {
    nombre_insumo, categoria_nombre, unidad_medida,
    stock_actual, stock_minimo, precio_unitario,
    estado, stock_bajo,
  } = insumo;

  const stockBajo = stock_bajo || stock_actual < stock_minimo;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activa : styles.inactiva}`}>
          {estado}
        </span>
        {stockBajo && (
          <span className={styles.alertBadge}>
            <FiAlertTriangle /> Stock bajo
          </span>
        )}
        <span className={styles.identifier}>{nombre_insumo}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Nombre del insumo" value={nombre_insumo}  full />
        <Field label="Categoría"         value={categoria_nombre} />
        <Field label="Unidad de medida"  value={unidad_medida} />
        <Field label="Precio unitario"   value={`$${Number(precio_unitario).toLocaleString()}`} />
        <Field
          label="Stock actual"
          value={`${stock_actual} ${unidad_medida}`}
          highlight={stockBajo}
        />
        <Field label="Stock mínimo" value={`${stock_minimo} ${unidad_medida}`} />
      </div>

    </div>
  );
}
