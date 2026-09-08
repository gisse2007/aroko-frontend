import { useState, useEffect } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useEmpleados } from "../../hooks/useEmpleados";
import { useToast }     from "../../hooks/useToast";
import { useLoading }   from "../../context/LoadingContext";
import Table            from "../../components/tables/Table";
import Modal            from "../../components/forms/Modal";
import ConfirmDialog    from "../../components/ConfirmDialog";
import Toast            from "../../components/Toast";
import Tooltip          from "../../components/Tooltip/Tooltip";
import EmpleadoForm     from "../../components/empleados/EmpleadoForm";
import EmpleadoDetalle  from "../../components/empleados/EmpleadoDetalle";
import api              from "../../api/axios";
import styles from "./Empleados.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>{value}</span>
);

const COLUMNS = [
  { key: "id_empleado",    label: "ID" },
  { key: "nombre",         label: "Nombre" },
  { key: "documento",      label: "Documento",
    render: (v, row) => `${row.tipo_documento}: ${v}` },
  { key: "telefono",       label: "Teléfono",  render: (v) => v || "—" },
  { key: "usuario_correo", label: "Usuario" },
  { key: "estado",         label: "Estado",    render: (v) => <EstadoBadge value={v} /> },
];

export default function Empleados() {
  const emp = useEmpleados();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (!modal.type || (modal.type !== MODAL.create && modal.type !== MODAL.edit)) return;
    setRolesLoading(true);
    api.get("/roles")
      .then(({ data }) => setRoles(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [modal.type]);

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => {
    const current = emp.findById(row.id_empleado) ?? row;
    setModal({
      type: MODAL.edit,
      row: {
        ...current,
        rol_id: current?.rol_id ?? current?.id_rol ?? current?.rol?.id_rol ?? current?.rol_id ?? "",
      },
    });
  };
  const openDetail = async (row) => {
    const empleadoId = row.id_empleado ?? row.id ?? row.usuario_id;
    const current = emp.findById(empleadoId) ?? row;
    setModal({ type: MODAL.detail, row: current });
    try {
      const detail = await emp.fetchById(empleadoId);
      setModal((previous) => previous.type === MODAL.detail
        ? { ...previous, row: detail }
        : previous);
    } catch (err) {
      show(err.response?.data?.message || "No se pudo cargar el detalle del empleado.", "error");
    }
  };
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Guardando empleado...");
    try {
      await emp.create(values);
      await emp.fetchAll();
      closeModal();
      show("Empleado creado con éxito. Las credenciales de acceso han sido enviadas a su correo electrónico.", "success");
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || "Error al registrar el empleado.";
      if (status === 409 || /duplicad|duplicate|ya existe|already/i.test(msg)) {
        show(msg, "error");
      } else if (/correo|email|mail/i.test(msg) && /envi|send/i.test(msg)) {
        show("Empleado creado, pero no se pudo enviar el correo con las credenciales.", "warning");
      } else {
        show(msg, "error");
      }
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando empleado...");
    try {
      await emp.update(modal.row.id_empleado, values);
      closeModal();
      show("Empleado actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el empleado.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await emp.toggleEstado(row.id_empleado);
      show("Estado del empleado actualizado exitosamente.", "info");
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
        await emp.softDelete(row.id_empleado);
        show("Empleado eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar el empleado.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada.", "info"); }
  };

  const emptyMsg = emp.loading
    ? "Cargando empleados…"
    : emp.data.length === 0
      ? "No hay empleados registrados."
      : "No se encontraron empleados con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este empleado?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",          label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",             label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Empleados</h2>
        <Tooltip label="Registrar un nuevo empleado">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo empleado</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, documento o usuario…"
            value={emp.search}
            onChange={(e) => emp.setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={emp.filterEstado}
          onChange={(e) => emp.setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={emp.filtered}
        loading={emp.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={emp.search + emp.filterEstado}
        extraActions={(row) => (
          <Tooltip label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}>
            <button
              className={`${styles.toggleBtn} ${row.estado === "ACTIVO" ? styles.toggleActivo : styles.toggleInactivo}`}
              onClick={() => handleToggle(row)}
              aria-label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}
            >
              {row.estado === "ACTIVO" ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          </Tooltip>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo empleado">
        <EmpleadoForm
          roles={roles}
          rolesLoading={rolesLoading}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          submitLabel="Registrar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar empleado">
        <EmpleadoForm
          defaultValues={modal.row ?? {}}
          roles={roles}
          rolesLoading={rolesLoading}
          isEdit
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del empleado">
        <EmpleadoDetalle empleado={modal.row} />
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
