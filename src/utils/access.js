export function normalizeAccessValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

function flattenAccessValues(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenAccessValues(item));
  if (typeof value === "object") {
    return [
      value.nombre,
      value.name,
      value.label,
      value.rol,
      value.rol_nombre,
      value.nombre_rol,
      value.modulo,
      value.modulo_nombre,
      value.moduloNombre,
      value.module,
      value.module_name,
      value.nombre_modulo,
      value.codigo,
      value.code,
      value.slug,
      value.permiso,
      value.descripcion,
      value.access,
      value.accesos,
      value.permisos,
      value.permisosAsignados,
      value.permissions,
      value.modulos,
      value.roles,
      value.role,
      value.role_name,
      value.rols,
      value.rol_asignado,
    ].flatMap((item) => flattenAccessValues(item));
  }
  return [String(value)];
}

function matchesAccessRule(access, rule) {
  const normalizedRule = normalizeAccessValue(rule);
  if (!normalizedRule) return false;

  return [...access].some((value) => {
    const normalizedValue = normalizeAccessValue(value);
    if (!normalizedValue) return false;

    return normalizedValue === normalizedRule;
  });
}

export function getUserAccessSet(user) {
  const set = new Set();

  const addValue = (...values) => {
    values.forEach((value) => {
      flattenAccessValues(value).forEach((entry) => {
        const normalized = normalizeAccessValue(entry);
        if (normalized) set.add(normalized);
      });
    });
  };

  if (user) {
    addValue(
      user.rol,
      user.nombre_rol,
      user.rol_nombre,
      user.role,
      user.role_name,
      user.roles,
      user.roles,
      user.rol?.nombre,
      user.rol?.name,
      user.rol?.rol,
      user.rol?.rol_nombre,
      user.rol?.nombre_rol,
      user.permisos,
      user.permisosAsignados,
      user.permissions,
      user.access,
      user.accesos,
      user.modulos,
      user.modulo,
      user.modulo_nombre,
      user.moduloNombre,
      user.permiso,
      user.rol?.permisos,
      user.rol?.permisosAsignados,
      user.role?.permisos,
      user.role?.permissions,
      user.roles?.map((role) => role?.nombre ?? role?.name ?? role)
    );
  }

  return set;
}

export function canAccessByRole(user, allowed = []) {
  if (!allowed || allowed.length === 0) return true;
  const access = getUserAccessSet(user);

  return allowed.some((rule) => {
    const normalizedRule = normalizeAccessValue(rule);
    return normalizedRule === "*" || matchesAccessRule(access, normalizedRule);
  });
}

export function filterMenuByUser(menu, user) {
  if (!Array.isArray(menu)) return [];

  const access = getUserAccessSet(user);

  return menu
    .filter((item) => {
      const parentAllowed = !item.access || item.access.length === 0 || item.access.some((rule) => {
        const normalizedRule = normalizeAccessValue(rule);
        return normalizedRule === "*" || matchesAccessRule(access, normalizedRule);
      });

      if (!parentAllowed) return false;

      if (!Array.isArray(item.children)) return true;

      const filteredChildren = item.children.filter((child) => {
        if (!child.access || child.access.length === 0) return true;
        return child.access.some((rule) => {
          const normalizedRule = normalizeAccessValue(rule);
          return normalizedRule === "*" || matchesAccessRule(access, normalizedRule);
        });
      });

      return filteredChildren.length > 0 || !item.children.length;
    })
    .map((item) => {
      if (!Array.isArray(item.children)) return item;
      return {
        ...item,
        children: item.children.filter((child) => {
          if (!child.access || child.access.length === 0) return true;
          return child.access.some((rule) => {
            const normalizedRule = normalizeAccessValue(rule);
            return normalizedRule === "*" || matchesAccessRule(access, normalizedRule);
          });
        }),
      };
    });
}
