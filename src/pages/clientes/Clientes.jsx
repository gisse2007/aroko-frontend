import { useState } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useClientes } from "../../hooks/useClientes";
import { useToast }    from "../../hooks/useToast";
import { useLoading }  from "../../context/LoadingContext";
import Table           from "../../components/tables/Table";
import Modal           from "../../components/forms/Modal";
import ConfirmDialog   from "../../components/ConfirmDialog";
import Toast           from "../../components/Toast";
import Tooltip         from "../../components/Tooltip/Tooltip";
import ClienteForm     from "../../components/clientes/ClienteForm";
import ClienteDetalle  from "../../components/clientes/ClienteDetalle";
import styles from "./Clientes.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>
    {value}
  </span>
);

const COLUMNS = [
  { key: "nombre",           label: "Nombre" },
  { key: "numero_documento", label: "Documento",
    render: (v, row) => `${row.tipo_documento}: ${v}` },
  { key: "telefono",         label: "Contacto" },
  { key: "email",            label: "Email",  render: (v) => v || "—" },
  { key: "estado",           label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Clientes() {
  const cli = useClientes();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit,   row });
  const openDetail = (row) => {
    const found = cli.findById(row.id_cliente);
    setModal({ type: MODAL.detail, row: found ?? row });
  };
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Guardando cliente...");
    try {
      await cli.create(values);
      // Limpiar filtros para mostrar el cliente nuevo inmediatamente
      cli.setSearch("");
      cli.setFilterEstado("");
      closeModal();
      show("Cliente registrado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el cliente.", "error");
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando cliente...");
    try {
      await cli.update(modal.row.id_cliente, values);
      closeModal();
      show("Cliente actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el cliente.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await cli.toggleEstado(row.id_cliente);
      // Limpiar filtro de estado para mostrar el cliente con su nuevo estado
      cli.setFilterEstado("");
      show("Estado del cliente actualizado exitosamente.", "info");
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
        await cli.softDelete(row.id_cliente);
        show("Cliente eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar el cliente.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada.", "info"); }
  };

  const emptyMsg = cli.loading
    ? "Cargando clientes…"
    : cli.data.length === 0
      ? "No hay clientes registrados."
      : "No se encontraron clientes con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este cliente?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",         label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",            label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Clientes</h2>
        <Tooltip label="Registrar un nuevo cliente">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo cliente</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, documento o email…"
            value={cli.search}
            onChange={(e) => cli.setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={cli.filterEstado}
          onChange={(e) => cli.setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={cli.filtered}
        loading={cli.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={cli.search + cli.filterEstado}

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

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo cliente">
        <ClienteForm
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          submitLabel="Registrar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar cliente">
        <ClienteForm
          defaultValues={modal.row ?? {}}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del cliente">
        <ClienteDetalle cliente={modal.row} />
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
