import { useEmpleados } from "../../hooks/useEmpleados";
import styles from "../Detalle.module.css";

const ESTADO_CLS = { Registrada: styles.registrada, Anulada: styles.anulada };

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export default function DevolucionDetalle({ devolucion }) {
  const empleados = useEmpleados();

  if (!devolucion) return null;
  const { pedido_id, empleado_id, fecha, motivo, estado, detalle, total } = devolucion;
  const empleado = empleados.data.find((e) => e.id_empleado === Number(empleado_id));
  const empleadoNombre = empleado ? `${empleado.nombre} — ${empleado.cargo}` : "—";

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>{estado}</span>
        <span className={styles.identifier}>Pedido: {pedido_id}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Pedido ID"  value={pedido_id} />
        <Field label="Fecha"      value={fecha} />
        <Field label="Empleado"   value={empleadoNombre} full />
        <Field label="Estado"     value={estado} />
      </div>

      <div className={styles.motivoBlock}>
        <div>
          <p className={styles.blockLabel}>Motivo</p>
          <p className={styles.blockValue}>{motivo}</p>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Detalle de productos</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {detalle.map((d) => (
                <tr key={d.producto_id}>
                  <td>{d.nombre_producto}</td>
                  <td>{d.cantidad}</td>
                  <td>${Number(d.precio).toLocaleString()}</td>
                  <td>${Number(d.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.totalesRow}>
          <span className={styles.totalFinal}>Total: <b>${Number(total).toLocaleString()}</b></span>
        </div>
      </div>
    </div>
  );
}
