import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEdit2, FiEye, FiXCircle, FiFileText, FiX, FiDollarSign } from "react-icons/fi";
import { usePedidos, ESTADOS_PEDIDO, ESTADOS_LABEL } from "../../hooks/usePedidos";
import { useToast }    from "../../hooks/useToast";
import { useLoading }  from "../../context/LoadingContext";
import { generarPDFPedido } from "../../services/pedidosPDF";
import Table           from "../../components/tables/Table";
import Modal           from "../../components/forms/Modal";
import ConfirmDialog   from "../../components/ConfirmDialog";
import Toast           from "../../components/Toast";
import Tooltip         from "../../components/Tooltip/Tooltip";
import PedidoForm      from "../../components/pedidos/PedidoForm";
import PedidoDetalle   from "../../components/pedidos/PedidoDetalle";
import api             from "../../api/axios";
import { normalizeProduct } from "../../utils/image";
import styles from "./Pedidos.module.css";

const MODAL   = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = { none: null, cancelar: "cancelar", cancelCreate: "cancelCreate", cancelEdit: "cancelEdit" };

const ESTADO_CLS = {
  ACTIVO: "activo", EN_ESPERA_FECHA: "espera", CON_FECHA_ASIGNADA: "conFecha",
  ACEPTADO: "aceptado", RECHAZADO: "rechazado", ENTREGADO: "entregado", INACTIVO: "inactivo",
};

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${styles[ESTADO_CLS[value]] ?? ""}`}>
    {ESTADOS_LABEL[value] ?? value}
  </span>
);

/** Los pedidos del Dashboard NO tienen prefijo "ORD-" */
const esDashboard = (row) => !String(row.numero_pedido ?? "").startsWith("ORD-");

const COLUMNS = [
  { key: "numero_pedido",  label: "N° Pedido",
    render: (v) => (
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {v}
        {String(v).startsWith("ORD-") && (
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, background: "rgba(59,190,218,0.12)",
            color: "#3bbeda", borderRadius: 999, padding: "1px 7px", border: "1px solid rgba(59,190,218,0.3)"
          }}>Catálogo</span>
        )}
      </span>
    )
  },
  { key: "cliente_nombre", label: "Cliente" },
  { key: "fecha_pedido",   label: "Fecha", render: (v) => v?.split("T")[0] ?? v },
  { key: "total",          label: "Total", render: (v) => `$${Number(v).toLocaleString()}` },
  { key: "estado",         label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Pedidos() {
  const ped = usePedidos();
  const navigate = useNavigate();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [clientes,  setClientes]  = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get("/clientes/select").then(({ data }) => setClientes(data.data ?? [])).catch(() => {});
    api.get("/empleados").then(({ data }) => setEmpleados(data.data ?? [])).catch(() => {});
    api.get("/productos/select").then(({ data }) => setProductos((data.data ?? []).map((p) => normalizeProduct(p)))).catch(() => {});
  }, []);

  const [modal,        setModal]        = useState({ type: MODAL.none, row: null });
  const [confirm,      setConfirm]      = useState({ type: CONFIRM.none, row: null });
  const [searchInput,  setSearchInput]  = useState("");
  const [estadoTarget, setEstadoTarget] = useState({ id: null, value: "" });

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit, row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row: ped.findById(row.id_pedido) ?? row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Registrar ── */
  const handleCreate = async (values, detalle) => {
    showOverlay("Registrando pedido...");
    try {
      await ped.create(values, detalle);
      // Limpiar filtros para mostrar el pedido nuevo inmediatamente
      ped.setSearch("");
      ped.setFilterEstado("");
      ped.setFechaDesde("");
      ped.setFechaHasta("");
      closeModal();
      show("Pedido registrado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el pedido.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Editar ── */
  const handleEdit = async (values, detalle) => {
    showOverlay("Actualizando pedido...");
    try {
      await ped.update(modal.row.id_pedido, values, detalle);
      closeModal();
      show("Pedido actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el pedido.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Cambiar estado ── */
  const handleEstadoChange = (row, nuevoEstado) => {
    // No permitir cambio si el valor seleccionado es el mismo estado actual
    if (nuevoEstado === row.estado) return;
    setEstadoTarget({ id: row.id_pedido, value: nuevoEstado });
  };

  const confirmarEstado = async () => {
    const { id, value } = estadoTarget;
    setEstadoTarget({ id: null, value: "" });
    try {
      await ped.cambiarEstado(id, value);
      show("Estado del pedido actualizado exitosamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al cambiar el estado.", "error");
    }
  };

  /* ── Cancelar pedido ── */
  const handleCancelarClick = (row) => setConfirm({ type: CONFIRM.cancelar, row });

  /* ── PDF ── */
  const handlePDF = (row) => {
    const found = ped.findById(row.id_pedido) ?? row;
    const result = generarPDFPedido(found);
    if (!result?.ok) show("Error al generar el PDF.", "error");
  };

  /* ── Resolver confirmaciones ── */
  const handleConfirm = async () => {
    const { type, row } = confirm;
    setConfirm({ type: CONFIRM.none, row: null });
    if (type === CONFIRM.cancelar) {
      try {
        await ped.cancelar(row.id_pedido);
        show("Pedido cancelado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al cancelar el pedido.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) closeModal();
    if (type === CONFIRM.cancelEdit)   closeModal();
  };

  /* ── Búsqueda ── */
  const handleBuscar = () => {
    if (!searchInput.trim()) { ped.setSearchError("Debe ingresar un criterio de búsqueda."); return; }
    ped.setSearchError("");
    ped.buscar(searchInput);
  };

  const handleClearSearch = () => { setSearchInput(""); ped.clearSearch(); };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleBuscar(); };

  const emptyMsg = ped.loading
    ? "Cargando pedidos…"
    : ped.data.length === 0
      ? "No hay pedidos registrados."
      : "No se encontraron pedidos con los criterios ingresados.";

  const confirmConfig = {
    [CONFIRM.cancelar]:     { message: "¿Estás seguro de cancelar este pedido?", label: "Sí, cancelar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",        label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",           label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Pedidos</h2>
        <Tooltip label="Registrar un nuevo pedido">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo pedido</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por N° pedido o cliente…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); ped.setSearchError(""); }}
            onKeyDown={handleKeyDown}
          />
          {searchInput && (
            <button className={styles.clearBtn} onClick={handleClearSearch}><FiX /></button>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleBuscar}>Buscar</button>
        <select
          className={styles.select}
          value={ped.filterEstado}
          onChange={(e) => { ped.setFilterEstado(e.target.value); ped.resetPage(); }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_PEDIDO.map((e) => (
            <option key={e} value={e}>{ESTADOS_LABEL[e]}</option>
          ))}
        </select>
        <input type="date" className={styles.dateInput} value={ped.fechaDesde}
          onChange={(e) => { ped.setFechaDesde(e.target.value); ped.resetPage(); }} title="Desde" />
        <input type="date" className={styles.dateInput} value={ped.fechaHasta}
          onChange={(e) => { ped.setFechaHasta(e.target.value); ped.resetPage(); }} title="Hasta" />
      </div>
      {ped.searchError && <p className={styles.searchError}>⚠ {ped.searchError}</p>}

      <Table
        columns={COLUMNS}
        data={ped.filtered}
        loading={ped.loading}
        emptyMessage={emptyMsg}
        showView={false}
        showEdit={false}
        showDelete={false}
        resetKey={ped.search + ped.filterEstado + ped.fechaDesde + ped.fechaHasta}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            <Tooltip label="Ver detalle">
              <button className={`${styles.actionBtn} ${styles.viewBtn}`}
                onClick={() => openDetail(row)} aria-label="Ver detalle">
                <FiEye />
              </button>
            </Tooltip>
            {row.estado !== "INACTIVO" && row.estado !== "ENTREGADO" && (
              <Tooltip label="Editar pedido">
                <button className={`${styles.actionBtn} ${styles.editBtn}`}
                  onClick={() => openEdit(row)} aria-label="Editar pedido">
                  <FiEdit2 />
                </button>
              </Tooltip>
            )}
            {/* El selector de estado solo aparece en pedidos del catálogo (ORD-) */}
            {!esDashboard(row) && row.estado !== "INACTIVO" && (
              <select
                className={styles.estadoSelect}
                value={row.estado}
                onChange={(e) => handleEstadoChange(row, e.target.value)}
                title="Cambiar estado"
              >
                {ESTADOS_PEDIDO.map((e) => (
                  <option key={e} value={e}>{ESTADOS_LABEL[e]}</option>
                ))}
              </select>
            )}
            {row.estado !== "INACTIVO" && (
              <Tooltip label="Cancelar pedido">
                <button className={`${styles.actionBtn} ${styles.cancelBtn}`}
                  onClick={() => handleCancelarClick(row)} aria-label="Cancelar pedido">
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
            {row.estado !== "INACTIVO" && (
              <Tooltip label="Registrar abono">
                <button
                  className={`${styles.actionBtn} ${styles.abonoBtn}`}
                  onClick={() => navigate(`/abonos?pedidoId=${row.id_pedido}`)}
                  aria-label="Registrar abono"
                >
                  <FiDollarSign />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo pedido">
        <PedidoForm
          clientes={clientes}
          empleados={empleados}
          productos={productos}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar pedido">
        <PedidoForm
          defaultValues={modal.row ?? {}}
          defaultDetalle={modal.row?.detalle ?? []}
          clientes={clientes}
          empleados={empleados}
          productos={productos}
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar pedido"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del pedido">
        <PedidoDetalle pedido={modal.row} />
      </Modal>

      <ConfirmDialog
        open={!!estadoTarget.id}
        message={`¿Cambiar estado a "${ESTADOS_LABEL[estadoTarget.value] ?? estadoTarget.value}"?`}
        confirmLabel="Sí, cambiar"
        variant="warning"
        onConfirm={confirmarEstado}
        onCancel={() => setEstadoTarget({ id: null, value: "" })}
      />

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
