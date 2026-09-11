import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle } from "react-icons/fi";
import FormField from "../forms/FormField";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import { formatCantidad } from "../../utils/number";
import styles from "../compras/CompraForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function SalidaForm({ empleados = [], insumosDisponibles = [], onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const [detalle,      setDetalle]      = useState([]);
  const [insumoSel,    setInsumoSel]    = useState("");
  const [cantidad,     setCantidad]     = useState("");
  const [detalleError, setDetalleError] = useState("");
  const [addMsg,       setAddMsg]       = useState("");

  const insumosActivos = insumosDisponibles.filter((i) => i.estado === "ACTIVO" && i.stock_actual > 0);

  const handleAgregar = () => {
    setDetalleError("");
    if (!insumoSel) { setDetalleError("Selecciona un insumo."); return; }
    const cant = Number(cantidad);
    if (!cant || cant <= 0) { setDetalleError("La cantidad debe ser mayor a 0."); return; }

    const ins = insumosDisponibles.find((i) => i.id_insumo === Number(insumoSel));
    if (!ins) return;

    if (cant > ins.stock_actual) {
      setDetalleError(`Stock insuficiente. Disponible: ${formatCantidad(ins.stock_actual)} ${ins.unidad_medida}.`);
      return;
    }
    if (detalle.some((d) => d.insumo_id === ins.id_insumo)) {
      setDetalleError("El insumo ya fue agregado."); return;
    }

    setDetalle((prev) => [
      ...prev,
      { insumo_id: ins.id_insumo, nombre_insumo: ins.nombre_insumo, unidad_medida: ins.unidad_medida, cantidad: cant },
    ]);
    setAddMsg("Insumo agregado.");
    setInsumoSel(""); setCantidad("");
    setTimeout(() => setAddMsg(""), 2000);
  };

  const handleEliminar = (insumo_id) =>
    setDetalle((prev) => prev.filter((d) => d.insumo_id !== insumo_id));

  const onFormSubmit = (values) => {
    if (!empleadoActual) { setDetalleError("Error: No se encontró un empleado vinculado al usuario autenticado."); return; }
    if (detalle.length === 0) { setDetalleError("Debe agregar al menos un insumo."); return; }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null }, detalle);
  };

  const insumoSelObj = insumosDisponibles.find((i) => i.id_insumo === Number(insumoSel));

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>
        {/* Responsable autocompletado con el usuario en sesión (solo lectura) */}
        <FormField label="Empleado responsable" name="empleado_id" type="text"
          value={empleadoActual?.nombre ?? ""}
          placeholder="Usuario en sesión"
          readOnly
          title="Vinculado automáticamente al usuario autenticado" />
        {!empleadoActual && (
          <p style={{ fontSize: "0.75rem", color: "#d93025", marginTop: -6 }}>
            No se encontró un empleado vinculado al usuario en sesión.
          </p>
        )}
        <FormField label="Motivo *" name="motivo" type="textarea" placeholder="Describe el motivo de la salida…"
          error={errors.motivo} {...register("motivo", { required: REQUIRED })} />
      </div>

      <div className={styles.insumoSection}>
        <p className={styles.sectionTitle}>Detalle de insumos</p>

        {insumosActivos.length === 0 ? (
          <p className={styles.noInsumos}>No hay insumos con stock disponible.</p>
        ) : (
          <div className={styles.insumoRow}>
            <select className={styles.insumoSelect} value={insumoSel}
              onChange={(e) => { setInsumoSel(e.target.value); setCantidad(""); }}>
              <option value="">— Seleccionar insumo —</option>
              {insumosActivos.map((i) => (
                <option key={i.id_insumo} value={i.id_insumo}>
                  {i.nombre_insumo} (Stock: {formatCantidad(i.stock_actual)} {i.unidad_medida})
                </option>
              ))}
            </select>
            <input type="number" min="0.01" step="any" placeholder="Cantidad"
              className={styles.numInput} value={cantidad}
              onChange={(e) => setCantidad(e.target.value)} />
            <button type="button" className={styles.addInsumoBtn} onClick={handleAgregar}>
              <FiPlusCircle /> Agregar
            </button>
          </div>
        )}

        {insumoSelObj && (
          <p style={{ fontSize: "0.78rem", color: "#1a6a80", marginTop: 2 }}>
            Stock disponible: <b>{formatCantidad(insumoSelObj.stock_actual)} {insumoSelObj.unidad_medida}</b>
          </p>
        )}

        {addMsg       && <p className={styles.insumoOk}>{addMsg}</p>}
        {detalleError && <p className={styles.detalleError}>⚠ {detalleError}</p>}

        {detalle.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Insumo</th><th>Unidad</th><th>Cantidad</th><th></th></tr></thead>
              <tbody>
                {detalle.map((d) => (
                  <tr key={d.insumo_id}>
                    <td>{d.nombre_insumo}</td>
                    <td>{d.unidad_medida}</td>
                    <td>{formatCantidad(d.cantidad)}</td>
                    <td>
                      <button type="button" className={styles.removeBtn}
                        onClick={() => handleEliminar(d.insumo_id)} title="Eliminar">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Registrar salida"}
        </button>
      </div>
    </form>
  );
}
