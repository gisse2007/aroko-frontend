  import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle } from "react-icons/fi";
import FormField from "../forms/FormField";
import { todayISO } from "../../hooks/usePedidos";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "./PedidoForm.module.css";

const REQUIRED = "Error: Debe completar todos los campos obligatorios.";

export default function PedidoForm({
  defaultValues = {},
  defaultDetalle = [],
  clientes = [],
  empleados = [],
  productos = [],
  onSubmit,
  onCancel,
  submitLabel = "Registrar pedido",
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const [detalle,      setDetalle]      = useState(defaultDetalle);
  const [productoSel,  setProductoSel]  = useState("");
  const [cantidad,     setCantidad]     = useState("");
  const [detalleError, setDetalleError] = useState("");
  const [productoMsg,  setProductoMsg]  = useState("");

  // Tipo de pago: null = no elegido, "abono" | "completo"
  const [tipoPago, setTipoPago] = useState(
    defaultDetalle.length > 0 ? "abono" : null
  );

  const today = todayISO();

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  const total = detalle.reduce((a, d) => a + d.subtotal, 0);

  /* ── Agregar producto ── */
  const handleAgregar = () => {
    setDetalleError(""); setProductoMsg("");
    if (!productoSel) { setDetalleError("Selecciona un producto."); return; }

    const prod = productos.find((p) => p.id_producto === Number(productoSel));
    if (!prod) return;

    if (prod.stock_producto <= 0) {
      setDetalleError("Error: Producto sin stock disponible.");
      return;
    }
    const cant = Number(cantidad);
    if (!cant || cant <= 0) { setDetalleError("La cantidad debe ser mayor a cero."); return; }
    if (cant > prod.stock_producto) {
      setDetalleError(`Error: Stock insuficiente. Disponible: ${prod.stock_producto}`);
      return;
    }
    if (detalle.some((d) => d.producto_id === prod.id_producto)) {
      setDetalleError("El producto ya fue agregado al pedido.");
      return;
    }

    setDetalle((prev) => [
      ...prev,
      { producto_id: prod.id_producto, nombre: prod.nombre, cantidad: cant, precio: prod.precio, subtotal: cant * prod.precio },
    ]);
    setProductoMsg("Producto agregado correctamente.");
    setProductoSel(""); setCantidad("");
    // Resetear tipo de pago si cambia el detalle
    setTipoPago(null);
    setTimeout(() => setProductoMsg(""), 2500);
  };

  const handleEliminar = (producto_id) => {
    setDetalle((prev) => prev.filter((d) => d.producto_id !== producto_id));
    setTipoPago(null);
  };

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      setDetalleError("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    if (detalle.length === 0) {
      setDetalleError("Error: Debe agregar al menos un producto.");
      return;
    }
    if (!tipoPago) {
      setDetalleError("Debe seleccionar el tipo de pago.");
      return;
    }

    const valorPagado = tipoPago === "completo" ? total : Number(values.valor_pagado ?? 0);
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit(
      {
        ...values,
        valor_pagado: valorPagado,
        empleado_id:  empleadoActual?.id_empleado ?? null,
      },
      detalle
    );
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        <FormField
          label="Cliente *"
          name="cliente_id"
          type="select"
          options={clientes.map((c) => ({ value: c.id_cliente, label: c.nombre }))}
          error={errors.cliente_id}
          {...reg("cliente_id", { required: REQUIRED })}
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

        <FormField
          label="Fecha de entrega"
          name="fecha_entrega"
          type="date"
          min={today}
          error={errors.fecha_entrega}
          {...reg("fecha_entrega", {
            validate: (v) => {
              if (!v) return true;
              return v >= today || "La fecha de entrega no puede ser anterior a hoy.";
            },
          })}
        />

        <div className={styles.fullWidth}>
          <FormField
            label="Observaciones"
            name="observaciones"
            type="textarea"
            placeholder="Observaciones del pedido…"
            {...reg("observaciones")}
          />
        </div>

      </div>

      {/* ── Agregar productos ── */}
      <div className={styles.productoSection}>
        <p className={styles.sectionTitle}>Productos del pedido</p>

        <div className={styles.productoRow}>
          <select
            className={styles.prodSelect}
            value={productoSel}
            onChange={(e) => setProductoSel(e.target.value)}
          >
            <option value="">— Seleccionar producto —</option>
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto} disabled={p.stock_producto <= 0}>
                {p.nombre} {p.stock_producto <= 0 ? "(Sin stock)" : `(Stock: ${p.stock_producto})`}
              </option>
            ))}
          </select>
          <input
            type="number" min="1" step="1" placeholder="Cantidad"
            className={styles.numInput}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <button type="button" className={styles.addBtn} onClick={handleAgregar}>
            <FiPlusCircle /> Agregar
          </button>
        </div>

        {productoMsg  && <p className={styles.msgOk}>✔ {productoMsg}</p>}
        {detalleError && <p className={styles.msgError}>⚠ {detalleError}</p>}

        {detalle.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {detalle.map((d) => (
                  <tr key={d.producto_id}>
                    <td>{d.nombre}</td>
                    <td>{d.cantidad}</td>
                    <td>${Number(d.precio).toLocaleString()}</td>
                    <td>${Number(d.subtotal).toLocaleString()}</td>
                    <td>
                      <button type="button" className={styles.removeBtn}
                        onClick={() => handleEliminar(d.producto_id)} title="Eliminar">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totalRow}>
              <span>Total: <strong>${total.toLocaleString()}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tipo de pago (solo cuando hay productos) ── */}
      {detalle.length > 0 && (
        <div className={styles.productoSection}>
          <p className={styles.sectionTitle}>¿Cómo realizará el pago el cliente?</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className={tipoPago === "completo" ? styles.addBtn : styles.cancelBtn}
              onClick={() => setTipoPago("completo")}
            >
              💳 Pago completo — ${total.toLocaleString()}
            </button>
            <button
              type="button"
              className={tipoPago === "abono" ? styles.addBtn : styles.cancelBtn}
              onClick={() => setTipoPago("abono")}
            >
              💰 Abono parcial
            </button>
          </div>

          {tipoPago === "abono" && (
            <div style={{ marginTop: 12 }}>
              <FormField
                label="Valor del abono *"
                name="valor_pagado"
                type="number"
                placeholder="0"
                min="0"
                step="1"
                error={errors.valor_pagado}
                {...reg("valor_pagado", {
                  required: "Ingrese el valor del abono.",
                  min: { value: 1, message: "El abono debe ser mayor a cero." },
                  validate: (v) =>
                    Number(v) <= total || `El abono no puede superar el total ($${total.toLocaleString()}).`,
                })}
              />
              <p style={{ fontSize: "0.78rem", color: "#888", marginTop: 4 }}>
                Saldo pendiente después del abono:{" "}
                <strong style={{ color: "#d93025" }}>
                  ${Math.max(0, total - Number(register("valor_pagado")?.value ?? 0)).toLocaleString()}
                </strong>
              </p>
            </div>
          )}

          {tipoPago === "completo" && (
            <p style={{ fontSize: "0.82rem", color: "#1a9e5c", fontWeight: 600, marginTop: 8 }}>
              ✔ Se registrará el pago completo de ${total.toLocaleString()}.
            </p>
          )}
        </div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
