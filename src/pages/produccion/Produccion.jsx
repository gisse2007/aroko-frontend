import { useState, useEffect } from "react";
import { FiXCircle, FiFileText, FiAlertCircle, FiChevronRight } from "react-icons/fi";
import { useProduccion, ESTADOS_PRODUCCION_LABEL, FILTROS_ESTADO_PRODUCCION } from "../../hooks/useProduccion";
import { useToast }          from "../../hooks/useToast";
import { useLoading }        from "../../context/LoadingContext";
import { generarPDFProduccion } from "../../services/produccionPDF";
import { formatCantidad } from "../../utils/number";
import Table              from "../../components/tables/Table";
import Modal              from "../../components/forms/Modal";
import ConfirmDialog      from "../../components/ConfirmDialog";
import Toast              from "../../components/Toast";
import Tooltip            from "../../components/Tooltip/Tooltip";
import ProduccionForm     from "../../components/produccion/ProduccionForm";
import ProduccionDetalle  from "../../components/produccion/ProduccionDetalle";
import AnularModal        from "../../components/produccion/AnularModal";
import api                from "../../api/axios";
import { normalizeProduct } from "../../utils/image";
import styles from "./Produccion.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, cancelCreate: "cancelCreate", estado: "estado" };

// Siguiente estado en el flujo
const SIGUIENTE_ESTADO = {
  EN_PROCESO: "COMPLETADA",
};

const ESTADO_CLS = {
  EN_PROCESO: "enProceso",
  COMPLETADA: "completada",
  REGISTRADA: "registrada",
  ANULADA:    "anulada",
};

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${styles[ESTADO_CLS[value]] ?? ""}`}>
    {ESTADOS_PRODUCCION_LABEL[value] ?? value}
  </span>
);

const COLUMNS = [
  { key: "fecha",           label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "empleado_nombre", label: "Empleado" },
  {
    key: "detalle",
    label: "Productos",
    render: (detalle) => (
      <span title={detalle?.map((d) => `${d.producto_nombre} (${formatCantidad(d.cantidad)})`).join(", ")}>
        {detalle?.length ?? 0} producto{detalle?.length !== 1 ? "s" : ""} —{" "}
        {formatCantidad(detalle?.reduce((s, d) => s + Number(d.cantidad), 0) ?? 0)} uds.
      </span>
    ),
  },
  { key: "estado", label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Produccion() {
  const prod = useProduccion();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [insumos,   setInsumos]   = useState([]);

  useEffect(() => {
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
    api.get("/productos").then(({ data }) => setProductos((data.data ?? []).map((p) => normalizeProduct(p)))).catch(() => {});
    api.get("/insumos").then(({ data }) => setInsumos(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,        setModal]        = useState({ type: MODAL.none, row: null });
  const [confirm,      setConfirm]      = useState({ type: CONFIRM.none, row: null, meta: null });
  const [anularTarget, setAnularTarget] = useState(null);
  const [fechaError,   setFechaError]   = useState("");

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openDetail = (row) => setModal({ type: MODAL.detail, row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null, meta: null });

  /* ── Registrar ── */
  const handleCreate = async (values, detalle) => {
    showOverlay("Registrando producción...");
    try {
      const res = await prod.registrar(values, detalle);
      closeModal();
      show("Producción registrada correctamente.");
      res.alertas?.forEach((a) => setTimeout(() => show(a, "info"), 400));
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la producción.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Avanzar estado ── */
  const handleAvanzarClick = (row) => {
    const siguiente = SIGUIENTE_ESTADO[row.estado];
    if (!siguiente) return;
    setConfirm({ type: CONFIRM.estado, row, meta: siguiente });
  };

  /* ── Anular ── */
  const handleAnularClick = (row) => {
    if (row.estado === "ANULADA") { show("La producción ya se encuentra anulada.", "error"); return; }
    if (row.estado === "COMPLETADA") { show("No se puede anular una producción completada.", "error"); return; }
    setAnularTarget(row);
  };

  const handleAnularConfirm = async (motivo) => {
    showOverlay("Anulando producción...");
    try {
      await prod.anular(anularTarget.id_produccion, motivo);
      setAnularTarget(null);
      show("Producción anulada correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al anular la producción.", "error");
    } finally { hideOverlay(); }
  };

  const handleAnularCancel = () => { setAnularTarget(null); show("Anular cancelado", "info"); };

  /* ── PDF ── */
  const handlePDFRow = async (row) => {
    const result = await generarPDFProduccion(row);
    if (!result?.ok) show("Error al generar el PDF.", "error");
  };

  /* ── Confirmaciones ── */
  const handleConfirm = async () => {
    const { type, row, meta } = confirm;
    setConfirm({ type: CONFIRM.none, row: null, meta: null });

    if (type === CONFIRM.estado) {
      showOverlay("Actualizando estado...");
      try {
        await prod.cambiarEstado(row.id_produccion, meta);
        show(`Estado actualizado a "${ESTADOS_PRODUCCION_LABEL[meta] ?? meta}".`);
      } catch (err) {
        show(err.response?.data?.message || "Error al cambiar el estado.", "error");
      } finally { hideOverlay(); }
    }
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado", "info"); }
  };

  /* ── Filtros de fecha ── */
  const handleDesde = (e) => {
    const val = e.target.value;
    prod.setFechaDesde(val);
    setFechaError(prod.fechaHasta && val > prod.fechaHasta ? "El rango de fechas no es válido." : "");
    prod.resetPage();
  };

  const handleHasta = (e) => {
    const val = e.target.value;
    prod.setFechaHasta(val);
    setFechaError(prod.fechaDesde && val < prod.fechaDesde ? "El rango de fechas no es válido." : "");
    prod.resetPage();
  };

  const emptyMsg = prod.loading
    ? "Cargando producciones…"
    : prod.data.length === 0
      ? "No hay producciones registradas."
      : "No se encontraron producciones con los filtros aplicados.";

  const siguienteLabel = confirm.meta ? (ESTADOS_PRODUCCION_LABEL[confirm.meta] ?? confirm.meta) : "";

  const confirmConfig = {
    [CONFIRM.estado]:       { message: `¿Cambiar el estado a "${siguienteLabel}"?`, label: "Sí, cambiar",  variant: "warning" },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",           label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Producción</h2>
        <Tooltip label="Registrar una nueva producción">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva producción</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.select}
          placeholder="Buscar empleado…"
          value={prod.filterEmpleado}
          onChange={(e) => { prod.setFilterEmpleado(e.target.value); prod.resetPage(); }}
        />
        <select className={styles.select} value={prod.filterEstado}
          onChange={(e) => { prod.setFilterEstado(e.target.value); prod.resetPage(); }}>
          <option value="">Todos los estados</option>
          {FILTROS_ESTADO_PRODUCCION.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className={styles.dateGroup}>
          <input type="date" className={styles.dateInput} value={prod.fechaDesde} onChange={handleDesde} title="Desde" />
          <span className={styles.dateSep}>—</span>
          <input type="date" className={styles.dateInput} value={prod.fechaHasta} onChange={handleHasta} title="Hasta" />
        </div>
      </div>

      {fechaError && <p className={styles.fechaError}><FiAlertCircle /> {fechaError}</p>}

      <Table
        columns={COLUMNS}
        data={prod.filtered}
        loading={prod.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={prod.filterEstado + prod.filterEmpleado + prod.fechaDesde + prod.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {SIGUIENTE_ESTADO[row.estado] && (
              <Tooltip label={`Avanzar a ${ESTADOS_PRODUCCION_LABEL[SIGUIENTE_ESTADO[row.estado]]}`}>
                <button
                  className={`${styles.actionBtn} ${styles.avanzarBtn}`}
                  onClick={() => handleAvanzarClick(row)}
                  aria-label={`Avanzar a ${ESTADOS_PRODUCCION_LABEL[SIGUIENTE_ESTADO[row.estado]]}`}
                >
                  <FiChevronRight />
                  <span className={styles.btnLabel}>{ESTADOS_PRODUCCION_LABEL[SIGUIENTE_ESTADO[row.estado]]}</span>
                </button>
              </Tooltip>
            )}
            {row.estado !== "ANULADA" && row.estado !== "COMPLETADA" && (
              <Tooltip label="Anular producción">
                <button className={`${styles.actionBtn} ${styles.anularBtn}`}
                  onClick={() => handleAnularClick(row)} aria-label="Anular producción">
                  <FiXCircle />
                </button>
              </Tooltip>
            )}
            <Tooltip label="Descargar PDF">
              <button className={`${styles.actionBtn} ${styles.pdfRowBtn}`}
                onClick={() => handlePDFRow(row)} aria-label="Descargar PDF">
                <FiFileText />
              </button>
            </Tooltip>
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva producción" size="lg">
        <ProduccionForm
          empleados={empleados}
          productos={productos}
          insumos={insumos}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle de producción">
        <ProduccionDetalle produccion={modal.row} />
      </Modal>

      <AnularModal
        open={!!anularTarget}
        produccion={anularTarget}
        onConfirm={handleAnularConfirm}
        onCancel={handleAnularCancel}
      />

      <ConfirmDialog
        open={confirm.type !== CONFIRM.none}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.label}
        variant={confirmConfig.variant}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ type: CONFIRM.none, row: null, meta: null })}
      />

      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
