import { useState, useEffect } from "react";
import { normalizeRole } from "../../hooks/useRoles";
import styles from "../Detalle.module.css";

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>{value || "—"}</span>
  </div>
);

export default function RolDetalle({ rol, fetchPermisos }) {
  // El listado de roles solo trae total_permisos (conteo), no el arreglo de
  // permisos; por eso se consultan aquí al abrir el detalle.
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const rolId = rol?.id_rol ?? null;

  useEffect(() => {
    if (!rolId || typeof fetchPermisos !== "function") return;

    let active = true;

    const cargar = async () => {
      setLoading(true);
      try {
        const data = await fetchPermisos(rolId);
        if (!active) return;
        setPermisos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar los permisos del rol:", err);
        if (!active) return;
        setPermisos([]);
        setError(err.response?.data?.message || "Error al cargar los permisos.");
      } finally {
        if (active) setLoading(false);
      }
    };

    cargar();

    return () => { active = false; };
  }, [rolId, fetchPermisos]);

  if (!rol) return <p className={styles.notFound}>Rol no encontrado.</p>;

  const { id_rol, nombre, descripcion } = rol;
  const estado = normalizeRole(rol).estado;
  const lista = Array.isArray(permisos) ? permisos : [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>
          {estado}
        </span>
        <span className={styles.identifier}>{nombre}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="ID"          value={String(id_rol)} />
        <Field label="Estado"      value={estado} />
        <Field label="Nombre"      value={nombre}      full />
        <Field label="Descripción" value={descripcion} full />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Permisos asignados ({lista.length})</p>
        {loading ? (
          <p className={styles.histNote}>Cargando permisos…</p>
        ) : error ? (
          <p className={styles.histNote}>{error}</p>
        ) : lista.length === 0 ? (
          <p className={styles.histNote}>Este rol no tiene permisos asignados.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Nombre</th><th>Descripción</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id_permiso}>
                    <td><code>{p.nombre}</code></td>
                    <td>{p.descripcion ?? "—"}</td>
                    <td>{p.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}