import { useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";

/**
 * useEmpleadoActual — resuelve el empleado vinculado al usuario autenticado
 * en la sesión activa.
 *
 * La coincidencia se hace por:
 *   1. `usuario_id` del empleado === id del usuario en sesión.
 *   2. `usuario_correo` del empleado === correo del usuario en sesión (fallback).
 *
 * @param {Array} [empleados] Lista de empleados ya cargada por el padre
 *                            (evita peticiones adicionales). Opcional.
 * @returns {{ id_empleado: number|string, nombre: string } | null}
 */
export function useEmpleadoActual(empleados) {
  const { user } = useAuthContext();

  return useMemo(() => {
    if (!user) return null;

    const uid    = user.id_usuario ?? user.usuario_id ?? user.id ?? null;
    const userEmployee = user.empleado ?? {};
    const directEmployeeId =
      user.empleado_id ?? user.empleado?.id_empleado ?? user.empleado?.empleado_id ?? userEmployee.id_empleado ?? userEmployee.empleado_id ?? null;
    const correo = String(user.correo || user.email || "").trim().toLowerCase();
    const lista  = (Array.isArray(empleados) ? empleados : [])
      .filter((empleado) => String(empleado?.estado ?? "ACTIVO").toUpperCase() === "ACTIVO");

    const porId =
      directEmployeeId != null
        ? lista.find((empleado) => Number(empleado?.id_empleado) === Number(directEmployeeId))
        : uid != null &&
      lista.find((e) => {
        const empleadoUid = e?.usuario_id ?? e?.id_usuario;
        return empleadoUid != null && Number(empleadoUid) === Number(uid);
      });

    const porCorreo =
      correo &&
      lista.find((e) => {
        const correoEmpleado = String(
          e?.usuario_correo || e?.correo || e?.email || ""
        ).trim().toLowerCase();
        return correoEmpleado === correo;
      });

    const found = porId || porCorreo;
    if (found) {
      return {
        ...found,
        id_empleado: found.id_empleado ?? found.empleado_id,
        nombre:
          found.nombre ||
          found.nombre_empleado ||
          found.empleado_nombre ||
          found.usuario_nombre ||
          found.usuario_correo ||
          correo,
      };
    }

    if (
      directEmployeeId != null &&
      String(userEmployee.estado ?? user.empleado_estado ?? "ACTIVO").toUpperCase() !== "INACTIVO"
    ) {
      return {
        ...userEmployee,
        id_empleado: directEmployeeId,
        nombre:
          user.empleado_nombre ||
          userEmployee.nombre ||
          userEmployee.nombre_empleado ||
          userEmployee.empleado_nombre ||
          user.nombre_usuario ||
          correo,
      };
    }

    return null;
  }, [user, empleados]);
}

export default useEmpleadoActual;