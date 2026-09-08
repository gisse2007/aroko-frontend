import { useState } from "react";
import { FiSearch, FiFileText, FiXCircle } from "react-icons/fi";
import { useDevoluciones } from "../../hooks/useDevoluciones";
import { usePedidos }      from "../../hooks/usePedidos";
import { useEmpleados }    from "../../hooks/useEmpleados";
import { useToast }        from "../../hooks/useToast";
import { useLoading }      from "../../context/LoadingContext";
import { generarPDFDevolucion } from "../../services/devolucionesPDF";
import Table         from "../../components/tables/Table";
import Modal         from "../../components/forms/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast         from "../../components/Toast";
import Tooltip       from "../../components/Tooltip/Tooltip";
import DevolucionForm   from "../../components/devoluciones/DevolucionForm";
import DevolucionDetalle from "../../components/devoluciones/DevolucionDetalle";
import styles from "./Devoluciones.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, anular: "anular", cancelCreate: "cancelCreate" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${styles[value?.toLowerCase()] ?? ""}`}>{value}</span>
);

const COLUMNS = [
  { key: "pedido_id",  label: "Pedido ID" },
  { key: "fecha",      label: "Fecha" },
  { key: "motivo",     label: "Motivo", render: (v) => v?.length > 40 ? v.slice(0, 40) + "…" : v },
  { key: "total",      label: "Total", render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "estado",     label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Devoluciones() {
  const hook = useDevoluciones();
  const ped  = usePedidos();
  const emp  = useEmpleados();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openDetail = (row) => setModal({ type: MODAL.detail, row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCreate = async (values, detalle) => {
    showOverlay("Registrando devolución...");
    try {
      await hook.create(values, detalle);
      closeModal();
      show("Devolución registrada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la devolución.", "error");
    } finally { hideOverlay(); }
  };

  const handleAnularClick = (row) => setConfirm({ type: CONFIRM.anular, row });
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });

  const handlePDF = (row) => {
    const ok = generarPDFDevolucion(row);
    if (!ok) show("Error al generar el PDF.", "error");
  };

  const handleConfirm = () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.anular) {
      hook.anular(row.id);
      show("Devolución anulada correctamente.");
    }
    if (type === CONFIRM.cancelCreate) closeModal();
  };

  const confirmConfig = {
    [CONFIRM.anular]:       { message: "¿Estás seguro de anular esta devolución?", label: "Sí, anular",   variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",           label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  const emptyMsg = hook.data.length === 0
    ? "No hay devoluciones registradas."
    : "No se encontraron devoluciones con los criterios ingresados.";

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Devoluciones</h2>
        <Tooltip label="Registrar una nueva devolución">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva devolución</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por pedido ID…"
            value={hook.search}
            onChange={(e) => { hook.setSearch(e.target.value); hook.resetPage(); }}
          />
        </div>
        <input type="date" className={styles.dateInput} value={hook.fechaDesde}
          onChange={(e) => { hook.setFechaDesde(e.target.value); hook.resetPage(); }} title="Desde" />
        <input type="date" className={styles.dateInput} value={hook.fechaHasta}
          onChange={(e) => { hook.setFechaHasta(e.target.value); hook.resetPage(); }} title="Hasta" />
      </div>

      <Table
        columns={COLUMNS}
        data={hook.filtered}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={hook.search + hook.fechaDesde + hook.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {row.estado !== "Anulada" && (
              <Tooltip label="Anular devolución">
                <button className={`${styles.actionBtn} ${styles.anularBtn}`}
                  onClick={() => handleAnularClick(row)} aria-label="Anular devolución">
                  <FiXCircle />
                </button>
              </Tooltip>
            )}
            <Tooltip label="Descargar PDF">
              <button className={`${styles.actionBtn} ${styles.pdfRowBtn}`}
                onClick={() => handlePDF(row)} aria-label="Descargar PDF">
                <FiFileText />
              </button>
            </Tooltip>
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva devolución">
        <DevolucionForm pedidos={ped.data} empleados={emp.data} onSubmit={handleCreate} onCancel={handleCancelCreate} />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle de devolución">
        <DevolucionDetalle devolucion={modal.row} />
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
