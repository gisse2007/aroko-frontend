import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

const getRoleName = (empleado) => {
  const usuario = empleado?.usuario ?? empleado?.usuario_asociado ?? empleado?.user ?? {};
  const rolSource = empleado?.rol ?? empleado?.role ?? usuario?.rol ?? usuario?.role ?? empleado?.usuario_rol ?? {};

  if (typeof rolSource === "string") return rolSource;
  if (Array.isArray(rolSource)) {
    const first = rolSource[0] ?? {};
    return first.nombre ?? first.name ?? first.rol_nombre ?? first.nombre_rol ?? empleado?.rol_nombre ?? empleado?.nombre_rol ?? "Sin rol";
  }

  return (
    rolSource?.nombre ??
    rolSource?.name ??
    rolSource?.rol ??
    rolSource?.rol_nombre ??
    rolSource?.nombre_rol ??
    usuario?.rol_nombre ??
    usuario?.nombre_rol ??
    empleado?.rol_nombre ??
    empleado?.nombre_rol ??
    "Sin rol"
  );
};

const getPermissions = (empleado) => {
  const usuario = empleado?.usuario ?? empleado?.usuario_asociado ?? empleado?.user ?? {};
  const rol = empleado?.rol ?? empleado?.role ?? usuario?.rol ?? usuario?.role ?? {};
  const candidates = [
    empleado?.permisos,
    empleado?.permisosAsignados,
    empleado?.accesos,
    empleado?.permissions,
    usuario?.permisos,
    usuario?.permisosAsignados,
    usuario?.accesos,
    usuario?.permissions,
    rol?.permisos,
    rol?.permisosAsignados,
    rol?.permissions,
    empleado?.rol?.permisos,
    usuario?.rol?.permisos,
  ];

  const values = candidates.find((entry) => Array.isArray(entry) || entry && typeof entry === "object") ?? [];
  const list = Array.isArray(values) ? values : [values];

  return list.flatMap((permission) => {
    if (permission == null) return [];
    if (typeof permission === "string") return [permission];
    if (Array.isArray(permission)) return permission.flatMap((item) => getPermissions({ ...empleado, permisos: item }));
    return [
      permission?.nombre,
      permission?.name,
      permission?.codigo,
      permission?.code,
      permission?.slug,
      permission?.permiso,
      permission?.descripcion,
    ].filter(Boolean);
  }).filter(Boolean);
};

export default function EmpleadoDetalle({ empleado }) {
  if (!empleado) return <p className={styles.notFound}>Empleado no encontrado.</p>;

  const {
    id_empleado, usuario_correo, nombre,
    tipo_documento, documento, telefono, cargo,
    area, direccion, email, salario, fecha_ingreso, estado,
  } = empleado;
  const rol = getRoleName(empleado);
  const permisos = getPermissions(empleado);

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
          {estado}
        </span>
        <span className={styles.identifier}>{nombre}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="ID empleado"         value={String(id_empleado)} />
        <Field label="Usuario asociado"    value={usuario_correo}      full />
        <Field label="Nombre completo"     value={nombre}              full />
        <Field label="Tipo de documento"   value={tipo_documento} />
        <Field label="Número de documento" value={documento} />
        <Field label="Teléfono"            value={telefono} />
        <Field label="Cargo"               value={cargo} />
        <Field label="Área"                value={area} />
        <Field label="Dirección"           value={direccion}           full />
        <Field label="Correo personal"     value={email}               full />
        <Field label="Salario"             value={salario ? `$${salario.toLocaleString("es-CO")}` : "—"} />
        <Field label="Fecha de ingreso"    value={fecha_ingreso} />
        <Field label="Estado"              value={estado} />
        <Field label="Rol"                 value={rol} />
        <Field label="Permisos"            value={permisos.length ? permisos.join(", ") : "Sin permisos asignados"} full />
      </div>

    </div>
  );
}
