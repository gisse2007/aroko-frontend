import { FiAlertTriangle, FiShoppingBag } from "react-icons/fi";
import styles from "../Detalle.module.css";
import { formatCantidad } from "../../utils/number";

const ESTADO_CLS = { REGISTRADA: styles.activo, ANULADA: styles.anulada };

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function VentaDetalle({ venta }) {
  if (!venta) return <p className={styles.notFound}>Venta no encontrada.</p>;

  const {
    numero_venta, cliente_nombre, empleado_nombre,
    fecha_venta, estado, motivo_anulacion,
    detalle = [], total, abonado, saldo, pedido_id,
  } = venta;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>{estado}</span>
        <span className={styles.identifier}>{numero_venta}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="N° Venta"       value={numero_venta} />
        <Field label="Fecha de venta" value={fecha_venta?.split("T")[0] ?? fecha_venta} />
        <Field label="Cliente"        value={cliente_nombre} full />
        <Field label="Empleado"       value={empleado_nombre} />
        {pedido_id && <Field label="Pedido asociado" value={`Pedido #${pedido_id}`} />}
        <Field label="Estado"         value={estado} />
        <Field label="Total"          value={`$${Number(total).toLocaleString()}`} />
        <Field label="Abonado"        value={`$${Number(abonado ?? 0).toLocaleString()}`} />
        <Field label="Saldo"          value={`$${Number(saldo ?? total).toLocaleString()}`} />
      </div>

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
        <p className={styles.sectionTitle}><FiShoppingBag /> Productos vendidos</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {detalle.map((d) => (
                <tr key={d.producto_id}>
                  <td>{d.nombre}</td>
                  <td>{formatCantidad(d.cantidad)}</td>
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
