import { useState, useEffect } from "react";
import { FiSearch, FiToggleLeft, FiToggleRight, FiAlertTriangle } from "react-icons/fi";
import { useProductos, STOCK_MINIMO } from "../../hooks/useProductos";
import { useToast }                   from "../../hooks/useToast";
import { useLoading }                 from "../../context/LoadingContext";
import Table          from "../../components/tables/Table";
import Modal          from "../../components/forms/Modal";
import ConfirmDialog  from "../../components/ConfirmDialog";
import Toast          from "../../components/Toast";
import Tooltip        from "../../components/Tooltip/Tooltip";
import ProductoForm   from "../../components/productos/ProductoForm";
import ProductoDetalle from "../../components/productos/ProductoDetalle";
import api            from "../../api/axios";
import styles from "./Productos.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, delete: "delete", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "ACTIVO" ? styles.activo : styles.inactivo}`}>{value}</span>
);

const StockCell = ({ stock }) => {
  const bajo = stock < STOCK_MINIMO;
  return (
    <span className={bajo ? styles.stockBajo : styles.stockOk}>
      {bajo && <FiAlertTriangle className={styles.stockIcon} />}
      {stock}
    </span>
  );
};

const COLUMNS = [
  { key: "nombre",           label: "Nombre" },
  { key: "categoria_nombre", label: "Categoría" },
  { key: "precio",           label: "Precio",  render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "stock_producto",   label: "Stock",   render: (v) => <StockCell stock={v} /> },
  { key: "estado",           label: "Estado",  render: (v) => <EstadoBadge value={v} /> },
];

export default function Productos() {
  const prod = useProductos();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [categorias, setCategorias] = useState([]);
  const [insumos,    setInsumos]    = useState([]);

  useEffect(() => {
    api.get("/categorias-productos").then(({ data }) => setCategorias(data.data ?? [])).catch(() => {});
    api.get("/insumos").then(({ data }) => setInsumos(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit,   row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row: prod.findById(row.id_producto) ?? row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values, receta) => {
    showOverlay("Guardando producto...");
    try {
      await prod.create(values, receta);
      closeModal();
      show("Producto registrado exitosamente.");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Error al registrar el producto.";
      show(errorMsg, "error");
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values, receta) => {
    showOverlay("Actualizando producto...");
    try {
      await prod.update(modal.row.id_producto, values, receta);
      closeModal();
      show("Producto actualizado exitosamente.");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Error al actualizar el producto.";
      show(errorMsg, "error");
    } finally { hideOverlay(); }
  };

  /* ── Toggle estado ── */
  const handleToggle = async (row) => {
    try {
      await prod.toggleEstado(row.id_producto);
      show("Estado del producto actualizado exitosamente.", "info");
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
        await prod.softDelete(row.id_producto);
        show("Producto eliminado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al eliminar el producto.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
    if (type === CONFIRM.cancelEdit)   { closeModal(); show("Edición cancelada.", "info"); }
  };

  const emptyMsg = prod.loading
    ? "Cargando productos…"
    : prod.data.length === 0
      ? "No se encontraron productos registrados."
      : "No se encontraron productos con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.delete]:       { message: "¿Estás seguro de eliminar este producto?", label: "Sí, eliminar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",          label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",             label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      {prod.stockBajoCount > 0 && (
        <div className={styles.globalAlert}>
          <FiAlertTriangle />
          {prod.stockBajoCount} producto{prod.stockBajoCount > 1 ? "s" : ""} con stock por debajo del mínimo ({STOCK_MINIMO} uds.).
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>Productos</h2>
        <Tooltip label="Registrar un nuevo producto">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo producto</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre o categoría…"
            value={prod.search}
            onChange={(e) => prod.setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={prod.filterCategoria}
          onChange={(e) => prod.setFilterCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>
        <select
          className={styles.select}
          value={prod.filterEstado}
          onChange={(e) => prod.setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      <Table
        columns={COLUMNS}
        data={prod.filtered}
        loading={prod.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDeleteClick}
        resetKey={prod.search + prod.filterCategoria + prod.filterEstado}
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

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo producto">
        <ProductoForm
          categorias={categorias}
          insumos={insumos}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          submitLabel="Registrar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar producto">
        <ProductoForm
          defaultValues={modal.row ?? {}}
          defaultReceta={modal.row?.receta ?? []}
          categorias={categorias}
          insumos={insumos}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del producto">
        <ProductoDetalle producto={modal.row} />
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
