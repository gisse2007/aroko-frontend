import { FiAlertTriangle } from "react-icons/fi";
import { ESTADOS_PRODUCCION_LABEL } from "../../hooks/useProduccion";
import styles from "../Detalle.module.css";

const ESTADO_CLS = {
  EN_PROCESO: styles.registrada,
  COMPLETADA: styles.registrada,
  ANULADA:    styles.anulada,
};

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export default function ProduccionDetalle({ produccion }) {
  if (!produccion) return null;

  const {
    fecha, empleado_nombre, estado,
    observaciones, motivo_anulacion, detalle = [],
  } = produccion;

  // Consecutivo real del registro: se resuelve con fallback para que
  // siempre coincida con el ID mostrado en el listado y en el PDF.
  const consecutivo = produccion.id_produccion ?? produccion.id;

  const totalUnidades = detalle.reduce((s, d) => s + Number(d.cantidad), 0);

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>
          {ESTADOS_PRODUCCION_LABEL[estado] ?? estado}
        </span>
        <span className={styles.identifier}>Producción #{consecutivo}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Fecha"          value={fecha?.split("T")[0] ?? fecha} />
        <Field label="Empleado"       value={empleado_nombre} />
        <Field label="Total unidades" value={`${totalUnidades} uds. en ${detalle.length} producto(s)`} full />
      </div>

      {observaciones && (
        <div className={styles.obsBlock}>
          <p className={styles.blockLabel}>Observaciones</p>
          <p className={styles.blockValue}>{observaciones}</p>
        </div>
      )}

      {motivo_anulacion && (
        <div className={styles.motivoBlock}>
          <FiAlertTriangle style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className={styles.blockLabel}>Motivo de anulación</p>
            <p className={styles.blockValue}>{motivo_anulacion}</p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Detalle de producción</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Producto</th><th>Cantidad producida</th></tr>
            </thead>
            <tbody>
              {detalle.map((d, i) => (
                <tr key={d.producto_id ?? i}>
                  <td>{d.producto_nombre}</td>
                  <td>{d.cantidad} uds.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}