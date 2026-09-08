import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>
      {value || "—"}
    </span>
  </div>
);

export default function ClienteDetalle({ cliente }) {
  if (!cliente) return <p className={styles.notFound}>Cliente no encontrado.</p>;

  const {
    nombre, tipo_documento, numero_documento,
    telefono, email, direccion,
    estado, pedidos,
  } = cliente;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
          {estado}
        </span>
        <span className={styles.identifier}>{nombre}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Nombre completo"     value={nombre}           full />
        <Field label="Tipo de documento"   value={tipo_documento} />
        <Field label="Número de documento" value={numero_documento} />
        <Field label="Teléfono"            value={telefono} />
        <Field label="Correo electrónico"  value={email} />
        <Field label="Dirección"           value={direccion}        full />
        <Field label="Pedidos realizados"  value={String(pedidos ?? 0)} />
        <Field label="Estado"              value={estado} />
      </div>

    </div>
  );
}
