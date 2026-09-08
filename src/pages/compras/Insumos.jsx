import { useState, useEffect } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight, FiAlertTriangle } from "react-icons/fi";
import { useInsumos } from "../../hooks/useInsumos";
import { useToast }   from "../../hooks/useToast";
import { useLoading } from "../../context/LoadingContext";
import Table          from "../../components/tables/Table";
import Modal          from "../../components/forms/Modal";
import ConfirmDialog  from "../../components/ConfirmDialog";
import Toast          from "../../components/Toast";
import Tooltip        from "../../components/Tooltip/Tooltip";
import InsumoForm     from "../../components/insumos/InsumoForm";
import InsumoDetalle  from "../../components/insumos/InsumoDetalle";
import api            from "../../api/axios";
import styles from "./Insumos.module.css";

/* ── Constantes de estado de UI ── */
const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

/* ── Badge estado ── */
const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>
    {value}
  </span>
);

/* ── Celda stock con alerta visual ── */
const StockCell = ({ actual, minimo }) => {
  const bajo = actual < minimo;
  return (
    <span className={bajo ? styles.stockBajo : styles.stockOk}>
      {bajo && <FiAlertTriangle className={styles.stockIcon} />}
      {actual}
    </span>
  );
};

const COLUMNS = [
  { key: "nombre_insumo",   label: "Nombre" },
  { key: "unidad_medida",   label: "Unidad" },
  {
    key: "stock_actual",
    label: "Stock actual",
    render: (v, row) => <StockCell actual={v} minimo={row.stock_minimo} />,
  },
  { key: "stock_minimo",    label: "Stock mín." },
  {
    key: "precio_unitario",
    label: "Precio unit.",
    render: (v) => `$${Number(v).toLocaleString()}`,
  },
  { key: "estado", label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Insumos() {
  const ins = useInsumos();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    api.get("/categorias-insumos").then(({ data }) => setCategorias(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  /* ── Abrir / cerrar modales ── */
  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit,   row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  /* ── Cancelar con confirmación ── */
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Guardando insumo...");
    try {
      const payload = { ...values };
      if (payload.stock_actual === undefined || payload.stock_actual === "") {
        payload.stock_actual = 0;
      }
      const res = await ins.create(payload);
      closeModal();
      show("Insumo registrado correctamente.");
      if (res?.data?.stock_bajo) show("El insumo se encuentra por debajo del stock mínimo.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el insumo.", "error");
    } finally {
      hideOverlay();
    }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando insumo...");
    try {
      const res = await ins.update(modal.row.id_insumo, values);
      closeModal();
      show("Insumo actualizado correctamente.");
      if (res?.data?.stock_bajo) show("El insumo se encuentra por debajo del stock mínimo.", "info");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el insumo.", "error");
    } finally {
      hideOverlay();
    }
  };

  /* ── Toggle estado ── */
  const handleToggleEstado = async (row) => {
    try {
      await ins.toggleEstado(row.id_insumo);
      show("Estado actualizado correctamente.", "info");
    } catch (err) {
      show(err.response?.data?.message || "No se puede cambiar el estado.", "error");
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
        await ins.softDelete(row.id_insumo);
        show("Insumo eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar el insumo.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada", "info"); }
  };

  const handleCancelConfirm = () => setConfirm({ type: CONFIRM.none, row: null });

  /* ── Filtros ── */
  const handleSearch = (e) => { ins.setSearch(e.target.value);       ins.resetPage(); };
  const handleUnidad = (e) => { ins.setFilterUnidad(e.target.value); ins.resetPage(); };
  const handleEstado = (e) => { ins.setFilterEstado(e.target.value); ins.resetPage(); };

  /* ── Mensajes vacíos ── */
  const emptyMsg = ins.loading
    ? "Cargando insumos…"
    : ins.data.length === 0
      ? "No hay insumos registrados."
      : "No se encontraron insumos con los criterios ingresados.";

  /* ── Config de confirmaciones ── */
  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este insumo?",      label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",             label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Estás seguro de cancelar la edición?",       label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      {/* ── Alerta global stock bajo ── */}
      {ins.stockBajoCount > 0 && (
        <div className={styles.globalAlert}>
          <FiAlertTriangle />
          {ins.stockBajoCount} insumo{ins.stockBajoCount > 1 ? "s" : ""} con stock por debajo del mínimo.
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Insumos</h2>
        <Tooltip label="Registrar un nuevo insumo">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo insumo</button>
        </Tooltip>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre…"
            value={ins.search}
            onChange={handleSearch}
          />
        </div>
        <select className={styles.select} value={ins.filterUnidad} onChange={handleUnidad}>
          <option value="">Todas las unidades</option>
          {ins.unidades.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className={styles.select} value={ins.filterEstado} onChange={handleEstado}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {/* ── Tabla ── */}
      <Table
        columns={COLUMNS}
        data={ins.filtered}
        loading={ins.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={ins.search + ins.filterUnidad + ins.filterEstado}
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

      {/* ── Modal Crear ── */}
      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo insumo">
        <InsumoForm categorias={categorias} onSubmit={handleCreate} onCancel={handleCancelCreate} submitLabel="Registrar" />
      </Modal>

      {/* ── Modal Editar ── */}
      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar insumo">
        <InsumoForm
          defaultValues={modal.row ?? {}}
          categorias={categorias}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      {/* ── Modal Detalle ── */}
      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del insumo">
        <InsumoDetalle insumo={modal.row} />
      </Modal>

      {/* ── Confirmaciones ── */}
      <ConfirmDialog
        open={confirm.type !== CONFIRM.none}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.label}
        variant={confirmConfig.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
