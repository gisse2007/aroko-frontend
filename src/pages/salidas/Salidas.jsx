import { useState, useEffect } from "react";
import { FiSearch, FiXCircle, FiFileText } from "react-icons/fi";
import { useSalidas }  from "../../hooks/useSalidas";
import { useToast }    from "../../hooks/useToast";
import { useLoading }  from "../../context/LoadingContext";
import { generarPDFSalida } from "../../services/salidasPDF";
import Table         from "../../components/tables/Table";
import Modal         from "../../components/forms/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast         from "../../components/Toast";
import Tooltip       from "../../components/Tooltip/Tooltip";
import SalidaForm    from "../../components/salidas/SalidaForm";
import SalidaDetalle from "../../components/salidas/SalidaDetalle";
import api           from "../../api/axios";
import styles from "./Salidas.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, anular: "anular", cancelCreate: "cancelCreate" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "REGISTRADA" ? styles.registrada : styles.anulada}`}>{value}</span>
);

const COLUMNS = [
  { key: "fecha",           label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "empleado_nombre", label: "Responsable" },
  {
    key: "detalle",
    label: "Insumos",
    render: (v) => v?.length === 1
      ? v[0].nombre_insumo
      : `${v?.[0]?.nombre_insumo ?? "—"} (+${(v?.length ?? 1) - 1} más)`,
  },
  { key: "detalle", label: "Cant. ítems", render: (v) => v?.length ?? 0 },
  { key: "estado",  label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Salidas() {
  const hook = useSalidas();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [empleados, setEmpleados] = useState([]);
  const [insumos,   setInsumos]   = useState([]);

  useEffect(() => {
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
    api.get("/insumos").then(({ data }) => setInsumos(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,   setModal]   = useState({ type: MODAL.none,   row: null });
  const [confirm, setConfirm] = useState({ type: CONFIRM.none, row: null });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openDetail = (row) => setModal({ type: MODAL.detail, row: hook.findById(row.id_salida) ?? row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });

  /* ── Registrar ── */
  const handleCreate = async (values, detalle) => {
    showOverlay("Registrando salida...");
    try {
      await hook.create(values, detalle);
      closeModal();
      show("Salida de insumos registrada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la salida.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Anular ── */
  const handleAnularClick = (row) => {
    if (row.estado === "ANULADA") { show("La salida ya se encuentra anulada.", "error"); return; }
    setConfirm({ type: CONFIRM.anular, row });
  };

  /* ── PDF ── */
  const handlePDF = (row) => {
    const ok = generarPDFSalida(row);
    if (!ok) show("Error al generar el PDF.", "error");
  };

  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.anular) {
      try {
        await hook.anular(row.id_salida);
        show("Salida anulada y stock restaurado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al anular la salida.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) closeModal();
  };

  const confirmConfig = {
    [CONFIRM.anular]:       { message: "¿Está seguro de anular esta salida? El stock será restaurado.", label: "Sí, anular",   variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",                              label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  const emptyMsg = hook.loading
    ? "Cargando salidas…"
    : hook.data.length === 0
      ? "No hay salidas de insumos registradas."
      : "No se encontraron salidas con los criterios ingresados.";

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Salidas de Insumos</h2>
        <Tooltip label="Registrar una nueva salida de insumos">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva salida</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Buscar por insumo o responsable…"
            value={hook.search} onChange={(e) => hook.setSearch(e.target.value)} />
        </div>
        <input type="date" className={styles.dateInput} value={hook.fechaDesde}
          onChange={(e) => hook.setFechaDesde(e.target.value)} title="Desde" />
        <input type="date" className={styles.dateInput} value={hook.fechaHasta}
          onChange={(e) => hook.setFechaHasta(e.target.value)} title="Hasta" />
      </div>

      <Table
        columns={COLUMNS}
        data={hook.filtered}
        loading={hook.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={hook.search + hook.fechaDesde + hook.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {row.estado !== "ANULADA" && (
              <Tooltip label="Anular salida">
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleAnularClick(row)} aria-label="Anular salida">
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

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva salida de insumos">
        <SalidaForm
          empleados={empleados}
          insumosDisponibles={insumos}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle de salida">
        <SalidaDetalle salida={modal.row} />
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
