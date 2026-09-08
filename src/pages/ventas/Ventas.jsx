import { useState, useEffect } from "react";
import { FiSearch, FiX, FiFileText, FiXCircle, FiTrendingUp } from "react-icons/fi";
import { useVentas }       from "../../hooks/useVentas";
import { useToast }        from "../../hooks/useToast";
import { useLoading }      from "../../context/LoadingContext";
import { generarPDFVenta } from "../../services/ventasPDF";
import Table               from "../../components/tables/Table";
import Modal               from "../../components/forms/Modal";
import ConfirmDialog       from "../../components/ConfirmDialog";
import Toast               from "../../components/Toast";
import Tooltip             from "../../components/Tooltip/Tooltip";
import VentaForm           from "../../components/ventas/VentaForm";
import VentaDetalle        from "../../components/ventas/VentaDetalle";
import AnularModal         from "../../components/produccion/AnularModal";
import api                 from "../../api/axios";
import { normalizeProduct } from "../../utils/image";
import styles from "./Ventas.module.css";

const MODAL   = { none: null, create: "create", detail: "detail" };
const CONFIRM = { none: null, cancelCreate: "cancelCreate" };

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${value === "REGISTRADA" ? styles.activa : styles.anulada}`}>
    {value}
  </span>
);

const COLUMNS = [
  { key: "numero_venta",   label: "N° Venta" },
  { key: "cliente_nombre", label: "Cliente" },
  { key: "fecha_venta",    label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "total",          label: "Total", render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "estado",         label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Ventas() {
  const ven = useVentas();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [clientes,  setClientes]  = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos,   setPedidos]   = useState([]);

  useEffect(() => {
    api.get("/clientes/select").then(({ data }) => setClientes(data.data ?? [])).catch(() => {});
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
    api.get("/productos/select").then(({ data }) => setProductos((data.data ?? []).map((p) => normalizeProduct(p)))).catch(() => {});
    api.get("/pedidos/aceptados").then(({ data }) => setPedidos(data.data ?? [])).catch(() => {});
  }, []);

  const [modal,        setModal]        = useState({ type: MODAL.none, row: null });
  const [confirm,      setConfirm]      = useState({ type: CONFIRM.none });
  const [anularTarget, setAnularTarget] = useState(null);
  const [searchInput,  setSearchInput]  = useState("");
  const [searchError,  setSearchError]  = useState("");

  const openCreate = () => {
    // Recargar pedidos aceptados cada vez que se abre el modal para tener datos frescos
    api.get("/pedidos/aceptados").then(({ data }) => setPedidos(data.data ?? [])).catch(() => {});
    setModal({ type: MODAL.create, row: null });
  };
  const openDetail = (row) => setModal({ type: MODAL.detail, row: ven.findById(row.id_venta) ?? row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });
  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate });

  /* ── Registrar ── */
  const handleCreate = async (values, detalle) => {
    showOverlay("Registrando venta...");
    try {
      await ven.registrar(values, detalle);
      closeModal();
      show("Venta registrada exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar la venta.", "error");
    } finally {
      hideOverlay();
    }
  };

  /* ── Anular ── */
  const handleAnularClick = (row) => {
    if (row.estado === "ANULADA") { show("La venta ya se encuentra anulada.", "error"); return; }
    setAnularTarget(row);
  };

  const handleAnularConfirm = async (motivo) => {
    showOverlay("Anulando venta...");
    try {
      await ven.anular(anularTarget.id_venta, motivo);
      setAnularTarget(null);
      show("Venta anulada exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al anular la venta.", "error");
    } finally {
      hideOverlay();
    }
  };

  const handleAnularCancel = () => { setAnularTarget(null); show("Anulación cancelada.", "info"); };

  /* ── PDF ── */
  const handlePDF = (row) => {
    const found = ven.findById(row.id_venta) ?? row;
    const result = generarPDFVenta(found);
    if (!result?.ok) show("Error al generar el reporte.", "error");
  };

  /* ── Confirmaciones ── */
  const handleConfirm = () => {
    const { type } = confirm;
    setConfirm({ type: CONFIRM.none });
    if (type === CONFIRM.cancelCreate) { closeModal(); show("Registro cancelado.", "info"); }
  };

  /* ── Búsqueda ── */
  const handleBuscar = () => {
    if (!searchInput.trim()) { setSearchError("Debe ingresar un criterio de búsqueda."); return; }
    setSearchError("");
    ven.fetchAll(searchInput);
  };

  const handleClearSearch = () => { setSearchInput(""); setSearchError(""); ven.fetchAll(); };

  const emptyMsg = ven.loading
    ? "Cargando ventas…"
    : ven.data.length === 0
      ? "No hay ventas registradas."
      : "No se encontraron resultados.";

  return (
    <div className={styles.page}>

      <div className={styles.kpi}>
        <FiTrendingUp className={styles.kpiIcon} />
        <div>
          <p className={styles.kpiLabel}>Total ingresos (ventas registradas)</p>
          <p className={styles.kpiValue}>${ven.totalIngresos.toLocaleString()}</p>
        </div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>Ventas</h2>
        <Tooltip label="Registrar una nueva venta">
          <button className={styles.addBtn} onClick={openCreate}>+ Nueva venta</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por N° venta o cliente…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          />
          {searchInput && (
            <button className={styles.clearBtn} onClick={handleClearSearch}><FiX /></button>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleBuscar}>Buscar</button>
        <select className={styles.select} value={ven.filterEstado}
          onChange={(e) => ven.setFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="REGISTRADA">Registrada</option>
          <option value="ANULADA">Anulada</option>
        </select>
        <input type="date" className={styles.dateInput} value={ven.fechaDesde}
          onChange={(e) => ven.setFechaDesde(e.target.value)} title="Desde" />
        <input type="date" className={styles.dateInput} value={ven.fechaHasta}
          onChange={(e) => ven.setFechaHasta(e.target.value)} title="Hasta" />
      </div>
      {searchError && <p className={styles.searchError}>⚠ {searchError}</p>}

      <Table
        columns={COLUMNS}
        data={ven.filtered}
        loading={ven.loading}
        emptyMessage={emptyMsg}
        onView={openDetail}
        showEdit={false}
        showDelete={false}
        resetKey={ven.search + ven.filterEstado + ven.fechaDesde + ven.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {row.estado !== "ANULADA" && (
              <Tooltip label="Anular venta">
                <button className={`${styles.actionBtn} ${styles.anularBtn}`}
                  onClick={() => handleAnularClick(row)} aria-label="Anular venta">
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

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nueva venta">
        <VentaForm
          clientes={clientes}
          empleados={empleados}
          productos={productos}
          pedidos={pedidos}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle de venta">
        <VentaDetalle venta={modal.row} />
      </Modal>

      <AnularModal
        open={!!anularTarget}
        produccion={anularTarget ? {
          detalle: anularTarget.detalle ?? [],
          fecha:   anularTarget.fecha_venta,
        } : null}
        title="¿Estás seguro de anular esta venta?"
        subtitle={
          anularTarget
            ? `${anularTarget.cliente_nombre} — ${anularTarget.numero_venta} · $${Number(anularTarget.total ?? 0).toLocaleString()}`
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
