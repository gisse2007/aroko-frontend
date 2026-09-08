import { useState } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useCategoriasInsumos } from "../../hooks/useCategoriasInsumos";
import { useToast }             from "../../hooks/useToast";
import Table          from "../../components/tables/Table";
import Modal          from "../../components/forms/Modal";
import ConfirmDialog  from "../../components/ConfirmDialog";
import Toast          from "../../components/Toast";
import Tooltip        from "../../components/Tooltip/Tooltip";
import CategoriaInsumoForm from "../../components/forms/CategoriaInsumoForm";
import styles from "./CategoriasInsumos.module.css";

const MODAL   = { none: null, create: "create", edit: "edit" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activa : styles.inactiva}`}>
    {value}
  </span>
);

const SortIcon = ({ col, sortBy, sortDir }) => {
  if (sortBy !== col) return <FiArrowUp className={styles.sortIconInactive} />;
  return sortDir === "asc"
    ? <FiArrowUp className={styles.sortIconActive} />
    : <FiArrowDown className={styles.sortIconActive} />;
};

export default function CategoriasInsumos() {
  const cat = useCategoriasInsumos();
  const { toast, show, hide } = useToast();

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => {
    if (row.estado === "INACTIVO") {
      show("No se puede modificar una categoría inactiva.", "error");
      return;
    }
    setModal({ type: MODAL.edit, row });
  };
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    try {
      await cat.create(values);
      closeModal();
      show("Categoría registrada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la categoría.", "error");
    }
  };

  const handleEdit = async (values) => {
    try {
      await cat.update(modal.row.id_categoria, values);
      closeModal();
      show("Categoría actualizada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar la categoría.", "error");
    }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await cat.toggleEstado(row.id_categoria);
      show("Estado de la categoría actualizado correctamente.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al cambiar el estado.", "error");
    }
  };

  /* ── Eliminar ── */
  // Validación: no permitir eliminar una categoría que tenga insumos asociados
  const handleDeleteClick = (row) => {
    const asociados = Number(row.total_insumos ?? 0);
    if (asociados > 0) {
      show(
        `No se puede eliminar la categoría "${row.nombre}" porque tiene ${asociados} insumo(s) asociado(s).`,
        "error"
      );
      return;
    }
    setConfirm({ type: CONFIRM.delete, row });
  };

  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.delete) {
      try {
        await cat.softDelete(row.id_categoria);
        show("Categoría eliminada correctamente.");
      } catch (err) {
        show(err.response?.data?.message || err.message || "Error al eliminar la categoría.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada", "info"); }
  };

  const COLUMNS = [
    {
      key: "nombre",
      label: (
        <button className={styles.sortBtn} onClick={() => cat.toggleSort("nombre")}>
          Nombre <SortIcon col="nombre" sortBy={cat.sortBy} sortDir={cat.sortDir} />
        </button>
      ),
    },
    { key: "total_insumos", label: "Insumos activos" },
    {
      key: "estado",
      label: (
        <button className={styles.sortBtn} onClick={() => cat.toggleSort("estado")}>
          Estado <SortIcon col="estado" sortBy={cat.sortBy} sortDir={cat.sortDir} />
        </button>
      ),
      render: (v) => <EstadoBadge value={v} />,
    },
  ];

  const emptyMsg = cat.loading
    ? "Cargando categorías…"
    : cat.data.length === 0
      ? "No hay categorías registradas."
      : "No se encontraron categorías con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar esta categoría?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",           label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Estás seguro de cancelar la edición?",     label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Categorías de Insumos</h2>
        <Tooltip label="Registrar una nueva categoría de insumos">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva categoría</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre…"
            value={cat.search}
            onChange={(e) => { cat.setSearch(e.target.value); cat.resetPage(); }}
          />
        </div>
        <select className={styles.select} value={cat.filterEstado}
          onChange={(e) => { cat.setFilterEstado(e.target.value); cat.resetPage(); }}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={cat.filtered}
        emptyMessage={emptyMsg}
        showView={false}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={cat.search + cat.filterEstado + cat.sortBy + cat.sortDir}
        extraActions={(row) => (
          <Tooltip label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}>
            <button
              className={`${styles.toggleBtn} ${row.estado === "ACTIVO" ? styles.toggleActiva : styles.toggleInactiva}`}
              onClick={() => handleToggle(row)}
              aria-label={`Cambiar a ${row.estado === "ACTIVO" ? "Inactivo" : "Activo"}`}
            >
              {row.estado === "ACTIVO" ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          </Tooltip>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva categoría">
        <CategoriaInsumoForm onSubmit={handleCreate} onCancel={handleCancelCreate} submitLabel="Registrar" />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar categoría">
        <CategoriaInsumoForm
          defaultValues={modal.row ?? {}}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
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
