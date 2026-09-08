import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function UsuarioDetalle({ usuario }) {
  if (!usuario) return <p className={styles.notFound}>Usuario no encontrado.</p>;

  const { id_usuario, correo, nombre_usuario, telefono,
          rol_nombre, estado, created_at, empleado_nombre, empleado_id } = usuario;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>{estado}</span>
        <span className={styles.identifier}>#{id_usuario}</span>
      </div>
      <div className={styles.fieldsGrid}>
        <Field label="Nombre"            value={nombre_usuario || "—"} />
        <Field label="Teléfono"          value={telefono} />
        <Field label="Correo"            value={correo}      full />
        <Field label="Rol"               value={rol_nombre} />
        <Field label="Estado"            value={estado} />
        <Field label="Empleado asociado" value={empleado_nombre || (empleado_id ? `ID: ${empleado_id}` : "No asociado")} full />
        <Field label="Contraseña"        value="••••••••" />
        <Field label="Fecha de registro" value={created_at?.split("T")[0]} />
      </div>
    </div>
  );
}
