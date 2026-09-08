import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export default function ProveedorDetalle({ proveedor }) {
  if (!proveedor) return null;
  const { nombre_proveedor, direccion, telefono, email, estado, empleado_nombre, compras } = proveedor;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
          {estado}
        </span>
        <span className={styles.identifier}>{nombre_proveedor}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Nombre proveedor"      value={nombre_proveedor} full />
        <Field label="Dirección"             value={direccion}        full />
        <Field label="Teléfono"              value={telefono} />
        <Field label="Email"                 value={email} />
        <Field label="Empleado responsable"  value={empleado_nombre} />
        <Field label="Compras registradas"   value={String(compras ?? 0)} />
      </div>

    </div>
  );
}
