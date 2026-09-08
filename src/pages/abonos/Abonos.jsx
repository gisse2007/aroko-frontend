import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiX, FiFileText, FiXCircle } from "react-icons/fi";
import { useAbonos }       from "../../hooks/useAbonos";
import { useToast }        from "../../hooks/useToast";
import { useLoading }      from "../../context/LoadingContext";
import { generarPDFAbono } from "../../services/abonosPDF";
import Table               from "../../components/tables/Table";
import Modal               from "../../components/forms/Modal";
import ConfirmDialog       from "../../components/ConfirmDialog";
import Toast               from "../../components/Toast";
import Tooltip             from "../../components/Tooltip/Tooltip";
import AbonoForm           from "../../components/abonos/AbonoForm";
import AbonoDetalle        from "../../components/abonos/AbonoDetalle";
import AnularModal         from "../../components/produccion/AnularModal";
import api                 from "../../api/axios";
import styles from "./Abonos.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, cancelCreate: "cancelCreate" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "REGISTRADO" ? styles.activo : styles.anulado}`}>
    {value}
  </span>
);

const COLUMNS = [
  { key: "numero_venta",   label: "N° Venta" },
  { key: "cliente_nombre", label: "Cliente" },
  { key: "fecha",          label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "valor",          label: "Valor", render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "numero_cuota",   label: "Cuota" },
  { key: "estado",         label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Abonos() {
  const abo = useAbonos();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [modal,        setModal]        = useState({ type: MODAL.none, row: null });
  const [confirm,      setConfirm]      = useState({ type: CONFIRM.none });
  const [anularTarget, setAnularTarget] = useState(null);
  const [searchInput,  setSearchInput]  = useState("");
  const [searchError,  setSearchError]  = useState("");

  /* ── Datos para el form ── */
  const [empleados,  setEmpleados]  = useState([]);
  const [ventas,     setVentas]     = useState([]);
  const [ventaActiva, setVentaActiva] = useState(null); // venta preseleccionada desde URL

  useEffect(() => {
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
    api.get("/ventas").then(({ data }) => setVentas(data.data ?? [])).catch(() => {});
  }, []);

  /* ── Venta preseleccionada desde ?pedidoId=X ── */
  useEffect(() => {
    const pedidoId = searchParams.get("pedidoId");
    if (!pedidoId) return;

    // Buscar venta asociada al pedido
    api.get("/ventas", { params: { search: "" } }).then(({ data: res }) => {
      const venta = (res.data ?? []).find((v) => v.pedido_id === Number(pedidoId));
      if (venta) {
        setVentaActiva(venta);
        setModal({ type: MODAL.create, row: null });
      } else {
        show("No se encontró una venta asociada a ese pedido.", "error");
      }
    }).catch(() => {});

    setSearchParams({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => { setVentaActiva(null); setModal({ type: MODAL.create, row: null }); };
  const openDetail = (row) => setModal({ type: MODAL.detail, row: abo.findById(row.id_abono) ?? row });
  const closeModal = () => { setModal({ type: MODAL.none, row: null }); setVentaActiva(null); };
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate });

  /* ── Registrar ── */
  const handleCreate = async (values, ventaId) => {
    showOverlay("Registrando abono...");
    try {
      await abo.registrar(values, ventaId);
      closeModal();
      show("Abono registrado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el abono.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Anular ── */
  const handleAnularClick = (row) => {
    if (row.estado === "ANULADO") { show("El abono ya se encuentra anulado.", "error"); return; }
    setAnularTarget(row);
  };

  const handleAnularConfirm = async () => {
    try {
      await abo.anular(anularTarget.id_abono);
      setAnularTarget(null);
      show("Abono anulado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al anular el abono.", "error");
    }
  };

  const handleAnularCancel = () => { setAnularTarget(null); show("Anulación cancelada.", "info"); };

  /* ── PDF ── */
  const handlePDF = (row) => {
    const found = abo.findById(row.id_abono) ?? row;
    const result = generarPDFAbono(found);
    if (!result?.ok) show("Error al generar el reporte.", "error");
  };

  const handleConfirm = () => {
    const { type } = confirm;
    setConfirm({ type: CONFIRM.none });
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
  };

  const handleBuscar = () => {
    if (!searchInput.trim()) { setSearchError("Debe ingresar un criterio de búsqueda."); return; }
    setSearchError(""); abo.setSearch(searchInput);
  };

  const handleClearSearch = () => { setSearchInput(""); setSearchError(""); abo.setSearch(""); };

  const emptyMsg = abo.loading
    ? "Cargando abonos…"
    : abo.data.length === 0
      ? "No hay abonos registrados."
      : "No se encontraron abonos con los criterios ingresados.";

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Abonos</h2>
        <Tooltip label="Registrar un nuevo abono">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo abono</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Buscar por N° venta o cliente…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()} />
          {searchInput && (
            <button className={styles.clearBtn} onClick={handleClearSearch}><FiX /></button>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleBuscar}>Buscar</button>
        <select className={styles.select} value={abo.filterEstado}
          onChange={(e) => abo.setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="REGISTRADO">Registrado</option>
          <option value="ANULADO">Anulado</option>
        </select>
        <input type="date" className={styles.dateInput} value={abo.fechaDesde}
          onChange={(e) => abo.setFechaDesde(e.target.value)} title="Desde" />
        <input type="date" className={styles.dateInput} value={abo.fechaHasta}
          onChange={(e) => abo.setFechaHasta(e.target.value)} title="Hasta" />
      </div>
      {searchError && <p className={styles.searchError}>⚠ {searchError}</p>}

      <Table
        columns={COLUMNS}
        data={abo.filtered}
        loading={abo.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={abo.search + abo.filterEstado + abo.fechaDesde + abo.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {row.estado !== "ANULADO" && (
              <Tooltip label="Anular abono">
                <button className={`${styles.actionBtn} ${styles.anularBtn}`}
                  onClick={() => handleAnularClick(row)} aria-label="Anular abono">
                  <FiXCircle />
                </button>
              </Tooltip>
            )}
            <Tooltip label="Descargar PDF">
              <button className={`${styles.actionBtn} ${styles.pdfBtn}`}
                onClick={() => handlePDF(row)} aria-label="Descargar PDF">
                <FiFileText />
              </button>
            </Tooltip>
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate}
        title={ventaActiva ? `Registrar abono — ${ventaActiva.numero_venta}` : "Nuevo abono"}>
        <AbonoForm
          ventas={ventas}
          empleados={empleados}
          ventaPreseleccionada={ventaActiva}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del abono">
        <AbonoDetalle abono={modal.row} />
      </Modal>

      <AnularModal
        open={!!anularTarget}
        produccion={anularTarget ? { detalle: [], fecha: anularTarget.fecha } : null}
        title="¿Estás seguro de anular este abono?"
        subtitle={
          anularTarget
            ? `${anularTarget.cliente_nombre} — Venta ${anularTarget.numero_venta} · $${Number(anularTarget.valor ?? 0).toLocaleString()}`
            : ""
        }
        confirmLabel="Sí, anular"
        onConfirm={handleAnularConfirm}
        onCancel={handleAnularCancel}
      />

      <ConfirmDialog
        open={confirm.type === CONFIRM.cancelCreate}
        message="¿Deseas cancelar este registro?"
        confirmLabel="Sí, cancelar"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ type: CONFIRM.none })}
      />

      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
