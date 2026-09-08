import { FiAlertTriangle } from "react-icons/fi";
import styles from "../Detalle.module.css";

const ESTADO_CLS = { REGISTRADO: styles.activo, ANULADO: styles.anulada };

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function AbonoDetalle({ abono }) {
  if (!abono) return <p className={styles.notFound}>Abono no encontrado.</p>;

  const {
    id_abono, numero_venta, cliente_nombre, empleado_nombre,
    fecha, valor, numero_cuota, metodo_pago,
    venta_total, venta_abonado, venta_saldo,
    estado,
  } = abono;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>{estado}</span>
        <span className={styles.identifier}>Abono #{id_abono}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="N° Venta"          value={numero_venta} />
        <Field label="Cuota"             value={String(numero_cuota ?? "—")} />
        <Field label="Cliente"           value={cliente_nombre}   full />
        <Field label="Empleado"          value={empleado_nombre} />
        <Field label="Fecha del abono"   value={fecha?.split("T")[0] ?? fecha} />
        <Field label="Método de pago"    value={metodo_pago} />
        <Field label="Valor abonado"     value={`$${Number(valor).toLocaleString()}`} />
        {venta_total    !== undefined && <Field label="Total venta"  value={`$${Number(venta_total).toLocaleString()}`} />}
        {venta_abonado  !== undefined && <Field label="Total abonado" value={`$${Number(venta_abonado).toLocaleString()}`} />}
        {venta_saldo    !== undefined && <Field label="Saldo restante" value={`$${Number(venta_saldo).toLocaleString()}`} />}
        <Field label="Estado"            value={estado} />
      </div>

    </div>
  );
}
