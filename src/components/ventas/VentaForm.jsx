import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle, FiAlertTriangle, FiLock } from "react-icons/fi";
import FormField from "../forms/FormField";
import { ESTADOS_LABEL } from "../../hooks/usePedidos";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "./VentaForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function VentaForm({ clientes = [], empleados = [], productos = [], pedidos = [], onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { fecha_venta: new Date().toISOString().split("T")[0] } });

  const pedidoId  = watch("pedido_id");
  const pedidoSel = pedidos.find((p) => p.id_pedido === Number(pedidoId)) ?? null;

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const [detalle,      setDetalle]      = useState([]);
  const [productoSel,  setProductoSel]  = useState("");
  const [cantidad,     setCantidad]     = useState("");
  const [detalleError, setDetalleError] = useState("");
  const [productoMsg,  setProductoMsg]  = useState("");

  const detalleEfectivo = pedidoSel
    ? (pedidoSel.detalle ?? []).map((d) => ({
        producto_id: d.producto_id,
        nombre:      d.nombre,
        cantidad:    d.cantidad,
        precio:      d.precio,
        subtotal:    d.subtotal,
      }))
    : detalle;

  const total = detalleEfectivo.reduce((a, d) => a + Number(d.subtotal), 0);

  const handlePedidoChange = () => {
    setDetalle([]); setProductoSel(""); setCantidad(""); setDetalleError(""); setProductoMsg("");
  };

  const handleAgregar = () => {
    setDetalleError(""); setProductoMsg("");
    if (!productoSel) { setDetalleError("Selecciona un producto."); return; }

    const prod = productos.find((p) => p.id_producto === Number(productoSel));
    if (!prod) return;

    const cant = Number(cantidad);
    if (!cant || cant <= 0) { setDetalleError("La cantidad debe ser mayor a cero."); return; }
    if (cant > prod.stock_producto) {
      setDetalleError(`Stock insuficiente. Disponible: ${prod.stock_producto} uds.`); return;
    }
    if (detalle.some((d) => d.producto_id === prod.id_producto)) {
      setDetalleError("El producto ya fue agregado."); return;
    }

    setDetalle((prev) => [
      ...prev,
      { producto_id: prod.id_producto, nombre: prod.nombre, cantidad: cant, precio: prod.precio, subtotal: cant * prod.precio },
    ]);
    setProductoMsg("Producto agregado.");
    setProductoSel(""); setCantidad("");
    setTimeout(() => setProductoMsg(""), 2500);
  };

  const handleEliminar = (producto_id) =>
    setDetalle((prev) => prev.filter((d) => d.producto_id !== producto_id));

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      setDetalleError("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    if (detalleEfectivo.length === 0) { setDetalleError("Debe agregar al menos un producto."); return; }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit(
      {
        ...values,
        pedido_id:   pedidoSel ? pedidoSel.id_pedido : null,
        empleado_id: empleadoActual?.id_empleado ?? null,
      },
      detalleEfectivo
    );
  };

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
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
          label="Fecha de venta *"
          name="fecha_venta"
          type="date"
          error={errors.fecha_venta}
          {...reg("fecha_venta", { required: REQUIRED })}
        />

        <div className={styles.fullWidth}>
          <label className={styles.fieldLabel}>Pedido asociado <span className={styles.optional}>(opcional)</span></label>
          <select
            className={styles.prodSelect}
            style={{ width: "100%", marginTop: 6 }}
            {...reg("pedido_id", { onChange: handlePedidoChange })}
          >
            <option value="">— Venta directa (sin pedido) —</option>
            {pedidos
              .filter((p) => p.estado !== "INACTIVO" && p.estado !== "ENTREGADO")
              .map((p) => (
                <option key={p.id_pedido} value={p.id_pedido}>
                  {p.numero_pedido} — {p.cliente_nombre} (${Number(p.total).toLocaleString()})
                </option>
              ))}
          </select>
          {pedidoSel && (
            <p className={styles.pedidoHint}>
              <FiLock style={{ fontSize: "0.75rem" }} />
              Los productos se cargan automáticamente desde el pedido y no pueden editarse.
            </p>
          )}
        </div>

      </div>

      <div className={styles.productoSection}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>
            {pedidoSel ? `Productos del pedido ${pedidoSel.numero_pedido}` : "Productos de la venta"}
          </p>
          {pedidoSel && <span className={styles.lockBadge}><FiLock /> Solo lectura</span>}
        </div>

        {!pedidoSel && (
          <div className={styles.productoRow}>
            <select className={styles.prodSelect} value={productoSel}
              onChange={(e) => { setProductoSel(e.target.value); setDetalleError(""); }}>
              <option value="">— Seleccionar producto —</option>
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto} disabled={p.stock_producto <= 0}>
                  {p.nombre} — ${Number(p.precio).toLocaleString()} (Stock: {p.stock_producto})
                </option>
              ))}
            </select>
            <input type="number" min="1" step="1" placeholder="Cantidad"
              className={styles.numInput} value={cantidad}
              onChange={(e) => { setCantidad(e.target.value); setDetalleError(""); }} />
            <button type="button" className={styles.addBtn} onClick={handleAgregar}>
              <FiPlusCircle /> Agregar
            </button>
          </div>
        )}

        {productoMsg  && <p className={styles.msgOk}>✓ {productoMsg}</p>}
        {detalleError && <p className={styles.msgError}><FiAlertTriangle /> {detalleError}</p>}

        {detalleEfectivo.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th>
                  {!pedidoSel && <th></th>}
                </tr>
              </thead>
              <tbody>
                {detalleEfectivo.map((d) => (
                  <tr key={d.producto_id} className={pedidoSel ? styles.rowLocked : ""}>
                    <td>{d.nombre}</td>
                    <td>{d.cantidad}</td>
                    <td>${Number(d.precio).toLocaleString()}</td>
                    <td>${Number(d.subtotal).toLocaleString()}</td>
                    {!pedidoSel && (
                      <td>
                        <button type="button" className={styles.removeBtn}
                          onClick={() => handleEliminar(d.producto_id)} title="Eliminar">
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totalRow}>Total: <strong>${total.toLocaleString()}</strong></div>
          </div>
        ) : (
          !pedidoSel && <p className={styles.emptyDetalle}>Agrega productos para continuar.</p>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Registrando…" : "Registrar venta"}
        </button>
      </div>
    </form>
  );
}
