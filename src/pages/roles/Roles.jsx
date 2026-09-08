import { useState } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight, FiShield } from "react-icons/fi";
import { useRoles, normalizeRole } from "../../hooks/useRoles";
import { useToast }      from "../../hooks/useToast";
import { useLoading }    from "../../context/LoadingContext";
import Table             from "../../components/tables/Table";
import Modal             from "../../components/forms/Modal";
import ConfirmDialog     from "../../components/ConfirmDialog";
import Toast             from "../../components/Toast";
import Tooltip           from "../../components/Tooltip/Tooltip";
import RolForm           from "../../components/roles/RolForm";
import RolDetalle        from "../../components/roles/RolDetalle";
import RolPermisos       from "../../components/roles/RolPermisos";
import styles from "./Roles.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail", permisos: "permisos" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => {
  const estado = normalizeRole({ estado: value }).estado;
  return (
  <span className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}>{estado}</span>
);
};

const COLUMNS = [
  { key: "id_rol",         label: "ID" },
  { key: "nombre",         label: "Nombre" },
  { key: "descripcion",    label: "Descripción", render: (v) => v?.length > 45 ? v.slice(0, 45) + "…" : v },
  { key: "total_permisos", label: "Permisos",    render: (v) => <span className={styles.permCount}>{v ?? 0}</span> },
  { key: "estado",         label: "Estado",      render: (v) => <EstadoBadge value={v} /> },
];

export default function Roles() {
  const hook = useRoles();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate   = () => setModal({ type: MODAL.create,   row: null });
  const openEdit     = (row) => setModal({ type: MODAL.edit,     row: hook.findById(row.id_rol) ?? row });
  const openDetail   = (row) => setModal({ type: MODAL.detail,   row: hook.findById(row.id_rol) ?? row });
  const openPermisos = (row) => setModal({ type: MODAL.permisos, row: hook.findById(row.id_rol) ?? row });
  const closeModal   = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Guardando rol...");
    try {
      await hook.create(values);
      closeModal();
      show("Rol registrado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el rol.", "error");
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando rol...");
    try {
      await hook.update(modal.row.id_rol, values);
      closeModal();
      show("Rol actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el rol.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await hook.toggleEstado(row.id_rol);
      show("Estado del rol actualizado.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al cambiar el estado.", "error");
    }
  };

  /* ── Eliminar ── */
  const handleDeleteClick = (row) => setConfirm({ type: CONFIRM.delete, row });

  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.delete) {
      try {
        await hook.remove(row.id_rol);
        show("Rol eliminado correctamente.");
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || "Error al eliminar el rol.";
        const hasAssociatedUsers = /usuario|usuarios|asociad|vincul|en uso|referenciad/i.test(message);
        show(
          hasAssociatedUsers
            ? "No se puede eliminar este rol porque tiene usuarios asociados."
            : message,
          "error"
        );
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada.", "info"); }
  };

  const emptyMsg = hook.loading
    ? "Cargando roles…"
    : hook.roles.length === 0
      ? "No hay roles registrados."
      : "No se encontraron roles con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",  label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",     label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Roles</h2>
          <span className={styles.subtitle}>{hook.filtered.length} rol{hook.filtered.length !== 1 ? "es" : ""} encontrado{hook.filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <Tooltip label="Registrar un nuevo rol">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo rol</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre o descripción…"
            value={hook.search}
            onChange={(e) => hook.setSearch(e.target.value)}
          />
        </div>
        <select className={styles.select} value={hook.filterEstado}
          onChange={(e) => hook.setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={hook.filtered}
        loading={hook.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={hook.search + hook.filterEstado}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            <Tooltip label={`Cambiar a ${normalizeRole(row).estado === "ACTIVO" ? "Inactivo" : "Activo"}`}>
              <button
                className={`${styles.toggleBtn} ${normalizeRole(row).estado === "ACTIVO" ? styles.toggleActivo : styles.toggleInactivo}`}
                onClick={() => handleToggle(row)}
                aria-label={`Cambiar a ${normalizeRole(row).estado === "ACTIVO" ? "Inactivo" : "Activo"}`}
              >
                {normalizeRole(row).estado === "ACTIVO" ? <FiToggleRight /> : <FiToggleLeft />}
              </button>
            </Tooltip>
            <Tooltip label="Gestionar permisos">
              <button
                className={`${styles.actionBtn} ${styles.permBtn}`}
                onClick={() => openPermisos(row)}
                aria-label="Gestionar permisos"
              >
                <FiShield />
              </button>
            </Tooltip>
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo rol">
        <RolForm onSubmit={handleCreate} onCancel={handleCancelCreate} submitLabel="Registrar" />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar rol">
        <RolForm
          defaultValues={modal.row ?? {}}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del rol">
        <RolDetalle rol={modal.row} fetchPermisos={hook.fetchPermisosRol} />
      </Modal>

      <Modal open={modal.type === MODAL.permisos} onClose={closeModal} title="Gestionar permisos del rol">
        <RolPermisos
          rol={modal.row}
          fetchPermisosRol={hook.fetchPermisosRol}
          fetchPermisosDisponibles={hook.fetchPermisosDisponibles}
          onAgregar={hook.agregarPermiso}
          onEliminar={hook.eliminarPermiso}
          onRefresh={() => hook.fetchAll()}
          show={show}
        />
      </Modal>

      <ConfirmDialog
        open={confirm.type !== CONFIRM.none}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.label}
        variant={confirmConfig.variant}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ type: CONFIRM.none, row: null })}
      />

      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
