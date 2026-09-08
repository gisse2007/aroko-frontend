/**
 * normalizeUser — único punto de normalización del objeto usuario.
 *
 * Backends soportados:
 *   /auth/login     → { id_usuario, nombre_usuario, correo, rol, rol_nombre }
 *   /auth/me        → { id_usuario, nombre_usuario, correo, rol, rol_nombre }
 *   /auth/register  → { id_usuario, nombre_usuario, correo, ... }
 *   403 CLIENTE     → { token, rol_nombre, id_usuario, nombre_usuario, ... }
 *
 * Garantías de salida:
 *   nombre_usuario → nombre real del backend, o "Usuario" — NUNCA el correo
 *   rol            → string en MAYÚSCULAS
 *   correo         → string (campo de contacto, no de identidad)
 *   empleado       → objeto del empleado asociado (si existe)
 *   empleado_id    → id numérico del empleado asociado (si existe)
 */
function extractText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof value === "object") {
    return [
      value.nombre,
      value.name,
      value.label,
      value.rol,
      value.rol_nombre,
      value.nombre_rol,
      value.descripcion,
      value.code,
      value.slug,
    ]
      .map((item) => extractText(item))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function flattenPermisos(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((item) => flattenPermisos(item));
  if (typeof raw === "object") {
    const direct = [
      raw.nombre,
      raw.name,
      raw.slug,
      raw.codigo,
      raw.code,
      raw.permiso,
      raw.modulo,
      raw.modulo_nombre,
      raw.moduloNombre,
      raw.rol,
      raw.rol_nombre,
      raw.nombre_rol,
    ];
    const nested = [raw.permisos, raw.permisosAsignados, raw.accesos, raw.access, raw.modulos, raw.role, raw.rol];
    return [...direct, ...nested].flatMap((item) => flattenPermisos(item));
  }
  return [String(raw)];
}

function extractEmpleado(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const candidates = [
    "empleado",
    "empleadoData",
    "empleado_asociado",
    "empleadoInfo",
    "empleadoRel",
    "employee",
    "empleado_datos",
    "empleadoRelacionado",
  ];
  for (const key of candidates) {
    const value = raw[key];
    if (value && typeof value === "object") {
      return value;
    }
  }
  return undefined;
}

export function normalizeUser(raw) {
  if (!raw) return null;

  const nombre_usuario =
    raw.nombre_usuario ||
    raw.nombre         ||
    raw.name           ||
    "Usuario";

  const rolSource = [
    raw.rol,
    raw.nombre_rol,
    raw.rol_nombre,
    raw.role,
    raw.role_name,
    raw.rol?.nombre,
    raw.rol?.name,
    raw.rol?.rol,
  ];

  const rol = extractText(rolSource.find(Boolean) ?? "").toUpperCase();
  const rol_nombre = extractText(rolSource.find(Boolean) ?? "");

  const permisos = flattenPermisos([
    raw.permisos,
    raw.permisosAsignados,
    raw.access,
    raw.accesos,
    raw.modulos,
    raw.modulo,
    raw.modulosAsignados,
    raw.permiso,
    raw.roles,
    raw.rol?.permisos,
    raw.rol?.permisosAsignados,
    raw.role?.permisos,
    raw.role?.permissions,
  ]).filter(Boolean);

  const empleado = extractEmpleado(raw);
  const empleado_id = raw.empleado_id ?? empleado?.id_empleado ?? empleado?.empleado_id ?? null;

  return {
    ...raw,
    id_usuario:    raw.id_usuario ?? raw.id ?? null,
    nombre_usuario,
    correo:        raw.correo || raw.email || "",
    rol,
    rol_nombre,
    permisos,
    empleado,
    empleado_id,
    empleado_nombre:
      raw.empleado_nombre ||
      empleado?.nombre ||
      empleado?.nombre_empleado ||
      empleado?.empleado_nombre ||
      null,
  };
}
