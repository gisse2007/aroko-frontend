import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle, FiAlertTriangle } from "react-icons/fi";
import FormField from "../forms/FormField";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "../compras/CompraForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function DevolucionForm({ pedidos = [], empleados = [], onSubmit, onCancel }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { fecha: new Date().toISOString().split("T")[0] },
  });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const pedidoId = watch("pedido_id");

  // Pedido seleccionado — busca por id numérico
  const pedidoSel = pedidos.find((p) => p.id_pedido === Number(pedidoId)) ?? null;

  // Productos disponibles = detalle del pedido seleccionado
  const productosDisponibles = pedidoSel?.detalle ?? [];

  const [detalle,      setDetalle]      = useState([]);
  const [productoSel,  setProductoSel]  = useState("");
  const [cantidad,     setCantidad]     = useState("");
  const [detalleError, setDetalleError] = useState("");
  const [addMsg,       setAddMsg]       = useState("");

  // Limpiar detalle al cambiar de pedido
  const handlePedidoChange = () => {
    setDetalle([]);
    setProductoSel("");
    setCantidad("");
    setDetalleError("");
  };

  const total = detalle.reduce((a, d) => a + d.subtotal, 0);

  const handleAgregar = () => {
    setDetalleError("");
    if (!pedidoSel)    { setDetalleError("Primero selecciona un pedido."); return; }
    if (!productoSel)  { setDetalleError("Selecciona un producto."); return; }

    const cant = Number(cantidad);
    if (!cant || cant <= 0) { setDetalleError("La cantidad debe ser mayor a cero."); return; }

    // Producto del detalle del pedido
    const itemPedido = productosDisponibles.find((p) => p.producto_id === Number(productoSel));
    if (!itemPedido) return;

    // Validar que no supere la cantidad comprada
    const yaAgregado = detalle.find((d) => d.producto_id === Number(productoSel));
    if (yaAgregado) { setDetalleError("El producto ya fue agregado."); return; }

    if (cant > itemPedido.cantidad) {
      setDetalleError(
        `No puedes devolver más de ${itemPedido.cantidad} unidad(es) de "${itemPedido.nombre}".`
      );
      return;
    }

    setDetalle((prev) => [
      ...prev,
      {
        producto_id:     itemPedido.producto_id,
        nombre_producto: itemPedido.nombre,
        cantidad:        cant,
        precio:          itemPedido.precio,
        subtotal:        cant * itemPedido.precio,
        max:             itemPedido.cantidad,
      },
    ]);

    setAddMsg("Producto agregado.");
    setProductoSel(""); setCantidad("");
    setTimeout(() => setAddMsg(""), 2000);
  };

  const handleEliminar = (producto_id) =>
    setDetalle((prev) => prev.filter((d) => d.producto_id !== producto_id));

  const onFormSubmit = (values) => {
    if (!empleadoActual) { setDetalleError("Error: No se encontró un empleado vinculado al usuario autenticado."); return; }
    if (!pedidoSel) { setDetalleError("Selecciona un pedido válido."); return; }
    if (detalle.length === 0) { setDetalleError("Debe agregar al menos un producto."); return; }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null }, detalle);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        {/* Pedido */}
        <div className={styles.fullWidth}>
          <FormField
            label="Pedido *"
            name="pedido_id"
            type="select"
            options={[
              { value: "", label: "— Seleccionar pedido —" },
              ...pedidos
                .filter((p) => p.estado !== "INACTIVO")
                .map((p) => ({
                  value: p.id_pedido,
                  label: `${p.numero_pedido} — ${p.cliente_nombre ?? p.cliente ?? "Cliente"} ($${Number(p.total).toLocaleString()})`,
                })),
            ]}
            error={errors.pedido_id}
            {...register("pedido_id", {
              required: REQUIRED,
              onChange: handlePedidoChange,
            })}
          />
        </div>

        {/* Fecha */}
        <FormField
          label="Fecha *"
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

        {/* Motivo */}
        <div className={styles.fullWidth}>
          <FormField
            label="Motivo *"
            name="motivo"
            type="textarea"
            placeholder="Describe el motivo de la devolución…"
            error={errors.motivo}
            {...register("motivo", {
              required: REQUIRED,
              minLength: { value: 10, message: "El motivo debe tener al menos 10 caracteres." },
            })}
          />
        </div>

      </div>

      {/* ── Detalle de productos ── */}
      <div className={styles.insumoSection}>
        <p className={styles.sectionTitle}>Productos a devolver</p>

        {!pedidoSel ? (
          <p className={styles.detalleEmpty}>
            Selecciona un pedido para ver los productos disponibles.
          </p>
        ) : (
          <>
            <div className={styles.insumoRow}>
              {/* Selector filtrado por pedido */}
              <select
                className={styles.insumoSelect}
                value={productoSel}
                onChange={(e) => { setProductoSel(e.target.value); setDetalleError(""); }}
              >
                <option value="">— Seleccionar producto —</option>
                {productosDisponibles.map((p) => (
                  <option
                    key={p.producto_id}
                    value={p.producto_id}
                    disabled={detalle.some((d) => d.producto_id === p.producto_id)}
                  >
                    {p.nombre} — comprado: {p.cantidad} uds. — ${p.precio.toLocaleString()} c/u
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="Cantidad"
                className={styles.numInput}
                value={cantidad}
                onChange={(e) => { setCantidad(e.target.value); setDetalleError(""); }}
                max={
                  productoSel
                    ? productosDisponibles.find((p) => p.producto_id === Number(productoSel))?.cantidad
                    : undefined
                }
              />

              <button type="button" className={styles.addInsumoBtn} onClick={handleAgregar}>
                <FiPlusCircle /> Agregar
              </button>
            </div>

            {/* Hint de cantidad máxima */}
            {productoSel && (() => {
              const item = productosDisponibles.find((p) => p.producto_id === Number(productoSel));
              return item ? (
                <p className={styles.maxHint}>
                  Máximo a devolver: <strong>{item.cantidad} unidad(es)</strong>
                </p>
              ) : null;
            })()}
          </>
        )}

        {addMsg       && <p className={styles.insumoOk}>{addMsg}</p>}
        {detalleError && (
          <p className={styles.detalleError}>
            <FiAlertTriangle /> {detalleError}
          </p>
        )}

        {detalle.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant. devuelta</th>
                  <th>Cant. comprada</th>
                  <th>Precio unit.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d) => (
                  <tr key={d.producto_id}>
                    <td>{d.nombre_producto}</td>
                    <td>{d.cantidad}</td>
                    <td style={{ color: "#888" }}>{d.max}</td>
                    <td>${d.precio.toLocaleString()}</td>
                    <td>${d.subtotal.toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleEliminar(d.producto_id)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totales}>
              <span className={styles.totalFinal}>Total devolución: <b>${total.toLocaleString()}</b></span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Registrar devolución"}
        </button>
      </div>
    </form>
  );
}
