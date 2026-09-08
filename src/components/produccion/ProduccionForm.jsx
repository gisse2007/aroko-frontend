import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiPlus, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import FormField from "../forms/FormField";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "./ProduccionForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

function calcularPreview(producto, cantidad, insumos) {
  const cant = Number(cantidad);
  if (!producto?.receta?.length || !cant || cant <= 0) return null;
  return producto.receta.map((r) => {
    const requerido  = parseFloat(r.cantidad_requerida) * cant;
    const insumo     = insumos.find((i) => i.id_insumo === r.insumo_id);
    const disponible = parseFloat(insumo?.stock_actual ?? 0);
    return {
      insumo_id:     r.insumo_id,
      nombre_insumo: r.nombre_insumo,
      unidad:        r.unidad,
      requerido,
      disponible,
      suficiente:    disponible >= requerido,
    };
  });
}

export default function ProduccionForm({ empleados = [], productos = [], insumos = [], onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fecha: new Date().toISOString().split("T")[0] },
  });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const [detalle,       setDetalle]       = useState([{ producto_id: "", cantidad: "" }]);
  const [detalleErrors, setDetalleErrors] = useState([]);

  const productosActivos = productos.filter((p) => p.estado === "ACTIVO");

  const addFila    = () => setDetalle((d) => [...d, { producto_id: "", cantidad: "" }]);
  const removeFila = (i) => {
    setDetalle((d) => d.filter((_, idx) => idx !== i));
    setDetalleErrors((e) => e.filter((_, idx) => idx !== i));
  };
  const updateFila = (i, field, value) => {
    setDetalle((d) => d.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
    setDetalleErrors((e) => e.map((err, idx) => idx === i ? { ...err, [field]: "" } : err));
  };

  const validarDetalle = () => {
    const errs = detalle.map((row) => ({
      producto_id: !row.producto_id ? "Selecciona un producto." : "",
      cantidad:    !row.cantidad || Number(row.cantidad) <= 0 ? "Cantidad inválida." : "",
    }));
    setDetalleErrors(errs);
    return errs.every((e) => !e.producto_id && !e.cantidad);
  };

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      setDetalleErrors([{ producto_id: "Error: No se encontró un empleado vinculado al usuario autenticado.", cantidad: "" }]);
      return;
    }
    if (!validarDetalle()) return;
    const ids = detalle.map((d) => d.producto_id);
    if (new Set(ids).size !== ids.length) {
      setDetalleErrors(detalle.map((row, i) => ({
        producto_id: ids.indexOf(row.producto_id) !== i ? "Producto duplicado." : "",
        cantidad: "",
      })));
      return;
    }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null }, detalle);
  };

  const hayInsuficiente = detalle.some((row) => {
    const prod = productos.find((p) => p.id_producto === Number(row.producto_id));
    return calcularPreview(prod, row.cantidad, insumos)?.some((r) => !r.suficiente);
  });

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>

      <p className={styles.sectionLabel}>Datos generales</p>
      <div className={styles.grid}>
        <FormField
          label="Fecha de producción *"
          name="fecha"
          type="date"
          error={errors.fecha}
          {...register("fecha", {
            required: REQUIRED,
            validate: (v) => v <= new Date().toISOString().split("T")[0] || "La fecha no puede ser futura.",
          })}
        />
        {/* Responsable autocompletado con el usuario en sesión (solo lectura) */}
        <FormField
          label="Empleado responsable"
          name="empleado_id"
          type="text"
          value={empleadoActual?.nombre ?? ""}
          placeholder="Usuario en sesión"
          readOnly
          title="Vinculado automáticamente al usuario autenticado"
        />
        {!empleadoActual && (
          <p style={{ fontSize: "0.75rem", color: "#d93025", marginTop: -6 }}>
            No se encontró un empleado vinculado al usuario en sesión.
          </p>
        )}
        <div className={styles.fullWidth}>
          <FormField
            label="Observaciones (opcional)"
            name="observaciones"
            type="textarea"
            placeholder="Observaciones generales de la producción…"
            {...register("observaciones")}
          />
        </div>
      </div>

      <div className={styles.detalleHeader}>
        <p className={styles.sectionLabel}>Detalle de productos</p>
        <button type="button" className={styles.addRowBtn} onClick={addFila}>
          <FiPlus /> Agregar producto
        </button>
      </div>

      <div className={styles.detalleTable}>
        <div className={styles.detalleHead}>
          <span>Producto</span><span>Cantidad</span><span>Insumos requeridos</span><span></span>
        </div>

        {detalle.map((row, i) => {
          const prod    = productos.find((p) => p.id_producto === Number(row.producto_id));
          const preview = calcularPreview(prod, row.cantidad, insumos);
          const err     = detalleErrors[i] || {};
          const hayInsuf = preview?.some((r) => !r.suficiente);

          return (
            <div key={i} className={`${styles.detalleRow} ${hayInsuf ? styles.rowWarn : ""}`}>
              <div className={styles.detalleCell}>
                <select
                  className={`${styles.detalleSelect} ${err.producto_id ? styles.inputError : ""}`}
                  value={row.producto_id}
                  onChange={(e) => updateFila(i, "producto_id", e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {productosActivos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                  ))}
                </select>
                {err.producto_id && <p className={styles.cellError}>{err.producto_id}</p>}
              </div>

              <div className={styles.detalleCell}>
                <input
                  type="number" min="1"
                  className={`${styles.detalleInput} ${err.cantidad ? styles.inputError : ""}`}
                  placeholder="0"
                  value={row.cantidad}
                  onChange={(e) => updateFila(i, "cantidad", e.target.value)}
                />
                {err.cantidad && <p className={styles.cellError}>{err.cantidad}</p>}
              </div>

              <div className={styles.detalleCell}>
                {preview ? (
                  <div className={styles.previewList}>
                    {preview.map((r) => (
                      <span
                        key={r.insumo_id}
                        className={`${styles.previewChip} ${!r.suficiente ? styles.chipInsuf : styles.chipOk}`}
                        title={`Requerido: ${r.requerido.toFixed(2)} ${r.unidad} | Disponible: ${r.disponible} ${r.unidad}`}
                      >
                        {r.nombre_insumo}: {r.requerido.toFixed(2)} {r.unidad}
                        {!r.suficiente && <FiAlertTriangle className={styles.chipIcon} />}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.previewEmpty}>Selecciona producto y cantidad</span>
                )}
              </div>

              <div className={styles.detalleCell}>
                {detalle.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeFila(i)} title="Eliminar fila">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hayInsuficiente && (
        <p className={styles.stockWarn}>
          <FiAlertTriangle /> Hay insumos con stock insuficiente. No se podrá registrar la producción.
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn}>Registrar producción</button>
      </div>
    </form>
  );
}
