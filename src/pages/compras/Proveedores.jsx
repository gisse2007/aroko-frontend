import { useState, useEffect } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { useProveedores, PAGE_SIZE } from "../../hooks/useProveedores";
import { useToast }   from "../../hooks/useToast";
import { useLoading } from "../../context/LoadingContext";
import Table           from "../../components/tables/Table";
import Modal           from "../../components/forms/Modal";
import ConfirmDialog   from "../../components/ConfirmDialog";
import Toast           from "../../components/Toast";
import Tooltip         from "../../components/Tooltip/Tooltip";
import ProveedorForm   from "../../components/proveedores/ProveedorForm";
import ProveedorDetalle from "../../components/proveedores/ProveedorDetalle";
import api             from "../../api/axios";
import styles from "./Proveedores.module.css";

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>
    {value}
  </span>
);

const COLUMNS = [
  { key: "nombre_proveedor", label: "Nombre proveedor" },
  { key: "telefono",         label: "Teléfono",  render: (v) => v || "—" },
  { key: "email",            label: "Email",     render: (v) => v || "—" },
  { key: "estado",           label: "Estado",    render: (v) => <EstadoBadge value={v} /> },
];

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

export default function Proveedores() {
  const prov = useProveedores();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit,   row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  const handleCreate = async (values) => {
    showOverlay("Guardando proveedor...");
    try {
      await prov.create(values);
      closeModal();
      show("Proveedor registrado correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el proveedor.", "error");
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando proveedor...");
    try {
      await prov.update(modal.row.id_proveedor, values);
      closeModal();
      show("Proveedor actualizado correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el proveedor.", "error");
    } finally { hideOverlay(); }
  };

  const handleToggleEstado = async (row) => {
    try {
      await prov.toggleEstado(row.id_proveedor);
      show("Estado del proveedor actualizado correctamente.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al cambiar el estado.", "error");
    }
  };

  const handleDeleteClick = (row) => setConfirm({ type: CONFIRM.delete, row });

  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.delete) {
      try {
        await prov.softDelete(row.id_proveedor);
        show("Proveedor eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar el proveedor.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) closeModal();
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada", "info"); }
  };

  const handleSearch = (e) => { prov.setSearch(e.target.value);       prov.resetPage(); };
  const handleEstado = (e) => { prov.setFilterEstado(e.target.value); prov.resetPage(); };

  const emptyMsg = prov.loading
    ? "Cargando proveedores…"
    : prov.data.length === 0
      ? "No hay proveedores registrados."
      : "No se encontraron proveedores con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este proveedor?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",           label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Estás seguro de cancelar la edición?",     label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Proveedores</h2>
        <Tooltip label="Registrar un nuevo proveedor">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo proveedor</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre…"
            value={prov.search}
            onChange={handleSearch}
          />
        </div>
        <select className={styles.select} value={prov.filterEstado} onChange={handleEstado}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={prov.filtered}
        loading={prov.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={prov.search + prov.filterEstado}
        extraActions={(row) => (
          <Tooltip label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}>
            <button
              className={`${styles.toggleBtn} ${row.estado === "ACTIVO" ? styles.toggleActive : styles.toggleInactive}`}
              onClick={() => handleToggleEstado(row)}
              aria-label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}
            >
              {row.estado === "ACTIVO" ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          </Tooltip>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo proveedor">
        <ProveedorForm
          empleados={empleados}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          submitLabel="Registrar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar proveedor">
        <ProveedorForm
          defaultValues={modal.row ?? {}}
          empleados={empleados}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del proveedor">
        <ProveedorDetalle proveedor={modal.row} />
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
