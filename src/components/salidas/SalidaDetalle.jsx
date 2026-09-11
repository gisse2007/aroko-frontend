import styles from "../Detalle.module.css";
import { formatCantidad } from "../../utils/number";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function SalidaDetalle({ salida }) {
  if (!salida) return <p className={styles.notFound}>Salida no encontrada.</p>;

  const { id_salida, empleado_nombre, fecha, motivo, estado, detalle = [] } = salida;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "REGISTRADA" ? styles.registrada : styles.anulada}`}>
          {estado}
        </span>
        <span className={styles.identifier}>Salida #{id_salida}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="ID salida" value={String(id_salida)} />
        <Field label="Fecha"     value={fecha?.split("T")[0] ?? fecha} />
        <Field label="Empleado"  value={empleado_nombre} full />
        <Field label="Estado"    value={estado} />
      </div>

      <div className={styles.motivoBlock}>
        <div>
          <p className={styles.blockLabel}>Motivo</p>
          <p className={styles.blockValue}>{motivo}</p>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Detalle de insumos</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Insumo</th><th>Unidad</th><th>Cantidad</th></tr></thead>
            <tbody>
              {detalle.map((d) => (
                <tr key={d.id_detalle ?? d.insumo_id}>
                  <td>{d.nombre_insumo}</td>
                  <td>{d.unidad_medida}</td>
                  <td>{formatCantidad(d.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
