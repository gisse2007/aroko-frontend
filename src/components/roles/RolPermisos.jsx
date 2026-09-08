import { useState, useEffect, useCallback, useRef } from "react";
import { FiSearch, FiTrash2, FiPlusCircle } from "react-icons/fi";
import { normalizeRole } from "../../hooks/useRoles";
import styles from "./RolPermisos.module.css";

export default function RolPermisos({
  rol,
  fetchPermisosRol,
  fetchPermisosDisponibles,
  onAgregar,
  onEliminar,
  onRefresh,
  show,
}) {
  const [asignados,   setAsignados]   = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [searchPerm,  setSearchPerm]  = useState("");
  const [permisoSel,  setPermisoSel]  = useState("");
  const [loading,     setLoading]     = useState(false);

  const rolId = rol?.id_rol ?? null;

  // Guardas contra condiciones de carrera y setState tras desmontar.
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const cargar = useCallback(async () => {
    if (!rolId) return;
    const reqId = ++requestRef.current;
    setLoading(true);
    try {
      const [asig, disp] = await Promise.all([
        fetchPermisosRol(rolId),
        fetchPermisosDisponibles(rolId),
      ]);
      // Descarta respuestas obsoletas (cambio de rol o desmontaje).
      if (!mountedRef.current || reqId !== requestRef.current) return;
      setAsignados(Array.isArray(asig) ? asig : []);
      setDisponibles(Array.isArray(disp) ? disp : []);
    } catch (err) {
      console.error("Error al cargar los permisos del rol:", err);
      if (mountedRef.current && reqId === requestRef.current) {
        setAsignados([]);
        setDisponibles([]);
        show?.(err.response?.data?.message || "Error al cargar los permisos.", "error");
      }
    } finally {
      if (mountedRef.current && reqId === requestRef.current) setLoading(false);
    }
    // `show` se excluye a propósito: es solo notificación y no debe relanzar la carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolId, fetchPermisosRol, fetchPermisosDisponibles]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!rol) return null;

  const estado = normalizeRole(rol).estado;

  const filtrados = searchPerm.trim()
    ? asignados.filter((p) => {
        const q = searchPerm.toLowerCase();
        return (
          p.nombre?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q)
        );
      })
    : asignados;

  const handleAgregar = async () => {
    if (!permisoSel) return;
    try {
      await onAgregar(rol.id_rol, Number(permisoSel));
      setPermisoSel("");
      show("Permiso agregado correctamente.", "info");
      cargar();
      onRefresh();
    } catch (err) {
      show(err.response?.data?.message || "Error al agregar el permiso.", "error");
    }
  };

  const handleEliminar = async (permisoId) => {
    try {
      await onEliminar(rol.id_rol, permisoId);
      show("Permiso eliminado.", "info");
      cargar();
      onRefresh();
    } catch (err) {
      show(err.response?.data?.message || "Error al eliminar el permiso.", "error");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.rolHeader}>
        <span className={styles.rolNombre}>{rol.nombre}</span>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
          {estado}
        </span>
      </div>

      {/* ── Agregar permiso ── */}
      <div className={styles.addRow}>
        <select
          className={styles.select}
          value={permisoSel}
          onChange={(e) => setPermisoSel(e.target.value)}
        >
          <option value="">— Seleccionar permiso —</option>
          {disponibles.map((p) => (
            <option key={p.id_permiso} value={p.id_permiso}>{p.nombre} — {p.descripcion}</option>
          ))}
        </select>
        <button type="button" className={styles.addBtn} onClick={handleAgregar} disabled={!permisoSel}>
          <FiPlusCircle /> Agregar
        </button>
      </div>
      {disponibles.length === 0 && !loading && (
        <p className={styles.noDisp}>Todos los permisos disponibles ya están asignados.</p>
      )}

      {/* ── Buscar permisos asignados ── */}
      <div className={styles.searchWrap}>
        <FiSearch className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar permiso asignado…"
          value={searchPerm}
          onChange={(e) => setSearchPerm(e.target.value)}
        />
      </div>

      <p className={styles.countLabel}>
        Permisos asignados: <b>{asignados.length}</b>
      </p>

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className={styles.empty}>
          {searchPerm ? "No se encontraron permisos con ese criterio." : "Este rol no tiene permisos asignados."}
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id_permiso}>
                  <td><code className={styles.code}>{p.nombre}</code></td>
                  <td>{p.descripcion ?? "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${p.estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td>
                    <button className={styles.removeBtn} onClick={() => handleEliminar(p.id_permiso)} title="Quitar permiso">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
