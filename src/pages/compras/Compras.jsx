import { useState, useEffect } from "react";
import { FiSearch, FiFileText, FiXCircle } from "react-icons/fi";
import { useCompras }   from "../../hooks/useCompras";
import { useToast }     from "../../hooks/useToast";
import { useLoading }   from "../../context/LoadingContext";
import { generarPDFCompra } from "../../services/comprasPDF";
import Table            from "../../components/tables/Table";
import Modal            from "../../components/forms/Modal";
import ConfirmDialog    from "../../components/ConfirmDialog";
import Toast            from "../../components/Toast";
import Tooltip          from "../../components/Tooltip/Tooltip";
import CompraForm       from "../../components/compras/CompraForm";
import CompraDetalle    from "../../components/compras/CompraDetalle";
import { BtnLoading }   from "../../components/loading/Loading";
import api              from "../../api/axios";
import styles from "./Compras.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, anular: "anular", cancelCreate: "cancelCreate" };

const ESTADO_CLASS = { ACTIVA: "activa", ANULADA: "anulada" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${styles[ESTADO_CLASS[value]] ?? ""}`}>{value}</span>
);

const COLUMNS = [
  { key: "numero_factura",   label: "N° Factura" },
  { key: "proveedor_nombre", label: "Proveedor" },
  { key: "fecha_compra",     label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "total_compra",     label: "Total", render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "estado",           label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Compras() {
  const comp = useCompras();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [actionLoading, setActionLoading] = useState(false);

  const [proveedores, setProveedores] = useState([]);
  const [insumos,     setInsumos]     = useState([]);
  const [empleados,   setEmpleados]   = useState([]);

  useEffect(() => {
    api.get("/proveedores").then(({ data }) => setProveedores(data.data ?? [])).catch(() => {});
    api.get("/insumos").then(({ data }) => setInsumos(data.data ?? [])).catch(() => {});
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openDetail = (row) => setModal({ type: MODAL.detail, row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });

  /* ── Registrar ── */
  const handleCreate = async (values, detalle, fotoFile) => {
    showOverlay("Registrando compra...");
    try {
      await comp.create(values, detalle, fotoFile);
      closeModal();
      show("Compra registrada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la compra.", "error");
    } finally {
      hideOverlay();
    }
  };

  /* ── Anular ── */
  const handleAnularClick = (row) => setConfirm({ type: CONFIRM.anular, row });

  const handlePDFRow = async (row) => {
    const result = await generarPDFCompra(row);
    if (!result?.ok) show("Error al generar el reporte.", "error");
  };

  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.anular) {
      setActionLoading(true);
      try {
        await comp.anular(row.id_compra);
        show("Compra anulada correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al anular la compra.", "error");
      } finally {
        setActionLoading(false);
      }
    }
    if (type === CONFIRM.cancelCreate) closeModal();
  };

  const handleSearch    = (e) => { comp.setSearch(e.target.value);           comp.resetPage(); };
  const handleProveedor = (e) => { comp.setFilterProveedor(e.target.value);  comp.resetPage(); };
  const handleDesde     = (e) => { comp.setFechaDesde(e.target.value);       comp.resetPage(); };
  const handleHasta     = (e) => { comp.setFechaHasta(e.target.value);       comp.resetPage(); };

  const emptyMsg = comp.loading
    ? "Cargando compras…"
    : comp.data.length === 0
      ? "No hay compras registradas."
      : "No se encontraron compras con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.anular]:       { message: "¿Estás seguro de anular esta compra?", label: "Sí, anular",   variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",       label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Compras</h2>
        <Tooltip label="Registrar una nueva compra">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva compra</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por factura…"
            value={comp.search}
            onChange={handleSearch}
          />
        </div>
        <select className={styles.select} value={comp.filterProveedor} onChange={handleProveedor}>
          <option value="">Todos los proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
          ))}
        </select>
        <input type="date" className={styles.dateInput} value={comp.fechaDesde} onChange={handleDesde} title="Desde" />
        <input type="date" className={styles.dateInput} value={comp.fechaHasta} onChange={handleHasta} title="Hasta" />
      </div>

      <Table
        columns={COLUMNS}
        data={comp.filtered}
        loading={comp.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={comp.search + comp.filterProveedor + comp.fechaDesde + comp.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {row.estado !== "ANULADA" && (
              <Tooltip label="Anular compra">
                <button
                  className={`${styles.actionBtn} ${styles.anularBtn}`}
                  onClick={() => handleAnularClick(row)}
                  aria-label="Anular compra"
                  disabled={actionLoading}
                >
                  <FiXCircle />
                </button>
              </Tooltip>
            )}
            <Tooltip label="Descargar PDF">
              <button
                className={`${styles.actionBtn} ${styles.pdfRowBtn}`}
                onClick={() => handlePDFRow(row)}
                aria-label="Descargar PDF"
              >
                <FiFileText />
              </button>
            </Tooltip>
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva compra">
        <CompraForm
          proveedores={proveedores}
          insumosDisponibles={insumos}
          empleados={empleados}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle de compra">
        <CompraDetalle compra={modal.row} />
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
