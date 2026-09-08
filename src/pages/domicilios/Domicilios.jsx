import { useState } from "react";
import { FiSearch, FiX, FiXCircle, FiChevronRight } from "react-icons/fi";
import { useDomicilios, ESTADOS_DOMICILIO, ESTADOS_LABEL } from "../../hooks/useDomicilios";
import { useClientes }  from "../../hooks/useClientes";
import { useVentas }    from "../../hooks/useVentas";
import { useEmpleados } from "../../hooks/useEmpleados";
import { useToast }     from "../../hooks/useToast";
import { useLoading }   from "../../context/LoadingContext";
import Table            from "../../components/tables/Table";
import Modal            from "../../components/forms/Modal";
import ConfirmDialog    from "../../components/ConfirmDialog";
import Toast            from "../../components/Toast";
import Tooltip          from "../../components/Tooltip/Tooltip";
import DomicilioForm    from "../../components/domicilios/DomicilioForm";
import DomicilioDetalle from "../../components/domicilios/DomicilioDetalle";
import styles from "./Domicilios.module.css";

const MODAL = { none: null, create: "create", edit: "edit", detail: "detail" };
const CONFIRM = {
  none: null,
  cancelCreate: "cancelCreate",
  cancelEdit:   "cancelEdit",
  cancelar:     "cancelar",
  estado:       "estado",
};

// Estados finales: no permiten ninguna acción
const ESTADOS_FINALES = ["ENTREGADO", "CANCELADO"];

// Siguiente estado según transiciones del backend
const SIGUIENTE_ESTADO = {
  PENDIENTE: "EN_CAMINO",
  EN_CAMINO: "ENTREGADO",
};

const ESTADO_CLS = {
  PENDIENTE: "pendiente",
  EN_CAMINO: "enCamino",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
};

const EstadoBadge = ({ value }) => (
  <span className={`${styles.badge} ${styles[ESTADO_CLS[value]] ?? ""}`}>
    {ESTADOS_LABEL[value] ?? value}
  </span>
);

const COLUMNS = [
  { key: "id_domicilio",   label: "ID" },
  { key: "direccion",      label: "Dirección",
    render: (v) => v && v.length > 35 ? v.slice(0, 35) + "…" : (v || "—") },
  { key: "cliente_nombre", label: "Cliente" },
  { key: "barrio",         label: "Barrio" },
  { key: "estado",         label: "Estado", render: (v) => <EstadoBadge value={v} /> },
];

export default function Domicilios() {
  const dom      = useDomicilios();
  const cliHook  = useClientes();
  const ventHook = useVentas();
  const empHook  = useEmpleados();
  const { toast, show, hide } = useToast();
  const { showOverlay, hideOverlay } = useLoading();

  const [modal,       setModal]       = useState({ type: MODAL.none, row: null });
  const [confirm,     setConfirm]     = useState({ type: CONFIRM.none, row: null, meta: null });
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");

  const openCreate = () => setModal({ type: MODAL.create, row: null });
  const openEdit   = (row) => setModal({ type: MODAL.edit, row });
  const openDetail = (row) => setModal({ type: MODAL.detail, row: dom.findById(row.id_domicilio) ?? row });
  const closeModal = () => setModal({ type: MODAL.none, row: null });

  const handleCancelCreate = () => setConfirm({ type: CONFIRM.cancelCreate, row: null });
  const handleCancelEdit   = () => setConfirm({ type: CONFIRM.cancelEdit,   row: null });

  /* ── Guardar ── */
  const handleCreate = async (values) => {
    showOverlay("Registrando domicilio...");
    try {
      await dom.create(values);
      closeModal();
      show("Domicilio registrado correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al registrar el domicilio.", "error");
    } finally { hideOverlay(); }
  };

  const handleEdit = async (values) => {
    showOverlay("Actualizando domicilio...");
    try {
      await dom.update(modal.row.id_domicilio, values);
      closeModal();
      show("Domicilio actualizado correctamente.");
    } catch (err) {
      show(err.response?.data?.message || "Error al actualizar el domicilio.", "error");
    } finally { hideOverlay(); }
  };

  /* ── Cambiar estado ── */
  const handleAvanzarClick = (row) => {
    const siguiente = SIGUIENTE_ESTADO[row.estado];
    if (!siguiente) return;
    setConfirm({ type: CONFIRM.estado, row, meta: siguiente });
  };

  const handleCancelarClick = (row) => {
    setConfirm({ type: CONFIRM.cancelar, row });
  };

  /* ── Resolver confirmaciones ── */
  const handleConfirm = async () => {
    const { type, row, meta } = confirm;
    setConfirm({ type: CONFIRM.none, row: null, meta: null });

    if (type === CONFIRM.estado) {
      try {
        await dom.cambiarEstado(row.id_domicilio, meta);
        show(`Estado actualizado a "${ESTADOS_LABEL[meta] ?? meta}".`);
      } catch (err) {
        show(err.response?.data?.message || "Error al cambiar el estado.", "error");
      }
    }
    if (type === CONFIRM.cancelar) {
      try {
        await dom.cancelar(row.id_domicilio);
        show("Domicilio cancelado correctamente.");
      } catch (err) {
        show(err.response?.data?.message || "Error al cancelar el domicilio.", "error");
      }
    }
    if (type === CONFIRM.cancelCreate) closeModal();
    if (type === CONFIRM.cancelEdit)   closeModal();
  };

  /* ── Búsqueda ── */
  const handleBuscar = () => {
    if (!searchInput.trim()) { setSearchError("Debe ingresar un criterio de búsqueda."); return; }
    setSearchError("");
    dom.setSearch(searchInput);
  };

  const handleClearSearch = () => { setSearchInput(""); setSearchError(""); dom.setSearch(""); };

  const emptyMsg = dom.data.length === 0
    ? "No hay domicilios registrados."
    : "No se encontraron domicilios con los criterios ingresados.";

  const siguienteLabel = confirm.meta ? (ESTADOS_LABEL[confirm.meta] ?? confirm.meta) : "";

  const confirmConfig = {
    [CONFIRM.estado]:       { message: `¿Cambiar el estado a "${siguienteLabel}"?`,  label: "Sí, cambiar",  variant: "warning" },
    [CONFIRM.cancelar]:     { message: "¿Está seguro de cancelar este domicilio?",   label: "Sí, cancelar", variant: "danger"  },
    [CONFIRM.cancelCreate]: { message: "¿Deseas cancelar este registro?",            label: "Sí, cancelar", variant: "warning" },
    [CONFIRM.cancelEdit]:   { message: "¿Deseas cancelar la edición?",               label: "Sí, cancelar", variant: "warning" },
  }[confirm.type] ?? {};

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h2 className={styles.title}>Domicilios</h2>
        <Tooltip label="Registrar un nuevo domicilio">
          <button className={styles.addBtn} onClick={openCreate}>+ Nuevo domicilio</button>
        </Tooltip>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por dirección, cliente o ID…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          />
          {searchInput && (
            <button className={styles.clearBtn} onClick={handleClearSearch}><FiX /></button>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleBuscar}>Buscar</button>
        <select
          className={styles.select}
          value={dom.filterEstado}
          onChange={(e) => dom.setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_DOMICILIO.map((e) => (
            <option key={e} value={e}>{ESTADOS_LABEL[e]}</option>
          ))}
        </select>
      </div>
      {searchError && <p className={styles.searchError}>⚠ {searchError}</p>}

      <Table
        columns={COLUMNS}
        data={dom.filtered}
        emptyMessage={emptyMsg}
        onView={openDetail}
        onEdit={(row) => {
          if (ESTADOS_FINALES.includes(row.estado)) {
            show("No se puede editar un domicilio en estado final.", "error");
            return;
          }
          openEdit(row);
        }}
        showDelete={false}
        resetKey={dom.search + dom.filterEstado}
        extraActions={(row) => (
          <div className={styles.rowActions}>
            {SIGUIENTE_ESTADO[row.estado] && (
              <Tooltip label={`Avanzar a ${ESTADOS_LABEL[SIGUIENTE_ESTADO[row.estado]]}`}>
                <button
                  className={`${styles.actionBtn} ${styles.avanzarBtn}`}
                  onClick={() => handleAvanzarClick(row)}
                  aria-label={`Avanzar a ${ESTADOS_LABEL[SIGUIENTE_ESTADO[row.estado]]}`}
                >
                  <FiChevronRight />
                  <span className={styles.btnLabel}>{ESTADOS_LABEL[SIGUIENTE_ESTADO[row.estado]]}</span>
                </button>
              </Tooltip>
            )}
            {!ESTADOS_FINALES.includes(row.estado) && (
              <Tooltip label="Cancelar domicilio">
                <button
                  className={`${styles.actionBtn} ${styles.cancelarBtn}`}
                  onClick={() => handleCancelarClick(row)}
                  aria-label="Cancelar domicilio"
                >
                  <FiXCircle />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      />

      <Modal open={modal.type === MODAL.create} onClose={handleCancelCreate} title="Nuevo domicilio">
        <DomicilioForm
          clientes={cliHook.data}
          ventas={ventHook.data}
          empleados={empHook.data}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          submitLabel="Registrar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.edit} onClose={handleCancelEdit} title="Editar domicilio">
        <DomicilioForm
          defaultValues={modal.row ?? {}}
          clientes={cliHook.data}
          ventas={ventHook.data}
          empleados={empHook.data}
          isEdit
          onSubmit={handleEdit}
          onCancel={handleCancelEdit}
          submitLabel="Actualizar"
        />
      </Modal>

      <Modal open={modal.type === MODAL.detail} onClose={closeModal} title="Detalle del domicilio">
        <DomicilioDetalle domicilio={modal.row} />
      </Modal>

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
