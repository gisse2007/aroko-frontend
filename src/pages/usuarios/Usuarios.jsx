import { useState, useEffect } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useUsuarios } from "../../hooks/useUsuarios";
import { useToast }    from "../../hooks/useToast";
import { useLoading }  from "../../context/LoadingContext";
import Table           from "../../components/tables/Table";
import Modal           from "../../components/forms/Modal";
import ConfirmDialog   from "../../components/ConfirmDialog";
import Toast           from "../../components/Toast";
import Tooltip         from "../../components/Tooltip/Tooltip";
import UsuarioForm     from "../../components/usuarios/UsuarioForm";
import UsuarioDetalle  from "../../components/usuarios/UsuarioDetalle";
import api             from "../../api/axios";
import styles from "./Usuarios.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>{value}</span>
);

const COLUMNS = [
  { key: "id_usuario",      label: "ID" },
  { key: "nombre_usuario",  label: "Nombre", render: (v) => v || "—" },
  { key: "correo",          label: "Correo" },
  { key: "rol_nombre",      label: "Rol" },
  { key: "empleado_nombre", label: "Empleado Asociado", render: (v) => v || "—" },
  { key: "estado",          label: "Estado", render: (v) => <EstadoBadge value={v} /> },
  { key: "created_at",      label: "Registro", render: (v) => v?.split("T")[0] },
];

export default function Usuarios() {
  const usu = useUsuarios();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    api.get("/roles").then(({ data }) => setRoles(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  /* ── Abrir / cerrar ── */
  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit,   row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row: usu.findById(row.id_usuario) });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Guardando usuario...");
    try {
      await usu.create(values);
      closeModal();
      show("Usuario creado con éxito. Las credenciales de acceso han sido enviadas a su correo electrónico.", "success");
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || "Error al registrar usuario.";
      if (status === 409 || /duplicad|duplicate|ya existe|already/i.test(msg)) {
        show(msg, "error");
      } else if (/correo|email|mail/i.test(msg) && /envi|send/i.test(msg)) {
        show("Usuario creado, pero no se pudo enviar el correo con las credenciales.", "warning");
      } else {
        show(msg, "error");
      }
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando usuario...");
    try {
      await usu.update(modal.row.id_usuario, values);
      closeModal();
      show("Usuario actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar usuario.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await usu.toggleEstado(row.id_usuario);
      show("Estado del usuario actualizado exitosamente.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al cambiar estado.", "error");
    }
  };

  /* ── Eliminar ── */
  const handleDeleteClick = (row) => setConfirm({ type: CONFIRM.delete, row });

  /* ── Resolver confirmaciones ── */
  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.delete) {
      try {
        await usu.softDelete(row.id_usuario);
        show("Usuario eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar usuario.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada.", "info"); }
  };

  const emptyMsg = usu.loading
    ? "Cargando usuarios…"
    : usu.data.length === 0
      ? "No hay usuarios registrados."
      : "No se encontraron usuarios con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este usuario?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",         label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",            label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Usuarios</h2>
        <Tooltip label="Registrar un nuevo usuario">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo usuario</button>
        </Tooltip>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por correo o rol…"
            value={usu.search}
            onChange={(e) => usu.setSearch(e.target.value)}
          />
        </div>
        <select className={styles.select} value={usu.filterRol}
          onChange={(e) => usu.setFilterRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
        </select>
        <select className={styles.select} value={usu.filterEstado}
          onChange={(e) => usu.setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {/* ── Tabla ── */}
      <Table
        columns={COLUMNS}
        data={usu.filtered}
        loading={usu.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={usu.search + usu.filterRol + usu.filterEstado}
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

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo usuario">
        <UsuarioForm roles={roles} onSubmit={handleCreate} onCancel={handleCancelCreate} submitLabel="Registrar" />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar usuario">
        <UsuarioForm defaultValues={modal.row ?? {}} roles={roles} isEdit
          onSubmit={handleEdit} onCancel={handleCancelEdit} submitLabel="Actualizar" />
      </Modal>

      {/* ── Modal Detalle ── */}
      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del usuario">
        <UsuarioDetalle usuario={modal.row} />
      </Modal>

      {/* ── Confirmaciones ── */}
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
