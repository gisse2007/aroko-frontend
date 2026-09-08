import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "./DomicilioForm.module.css";

export default function DomicilioForm({
  defaultValues = {},
  clientes  = [],
  ventas    = [],
  empleados = [],
  isEdit    = false,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const [clienteSelId, setClienteSelId] = useState(
    defaultValues.cliente_id ? Number(defaultValues.cliente_id) : null
  );

  // Ventas activas filtradas por cliente seleccionado
  const ventasFiltradas = ventas.filter((v) => {
    const activa     = v.estado === "REGISTRADA";
    const delCliente = !clienteSelId || Number(v.cliente_id) === clienteSelId;
    return activa && delCliente;
  });

  // Rellena dirección desde un cliente dado su id
  const rellenarDireccion = (clienteId) => {
    const cliente = clientes.find((c) => Number(c.id_cliente) === Number(clienteId));
    if (cliente?.direccion) {
      setValue("direccion", cliente.direccion, { shouldValidate: true });
    }
  };

  const handleClienteChange = (e) => {
    const id = Number(e.target.value) || null;
    setClienteSelId(id);
    setValue("venta_id", "");          // limpiar venta al cambiar cliente
    if (id) rellenarDireccion(id);
  };

  const handleVentaChange = (e) => {
    const ventaId = Number(e.target.value) || null;
    if (!ventaId) return;
    const venta = ventas.find((v) => Number(v.id_venta) === ventaId);
    if (venta?.cliente_id) rellenarDireccion(venta.cliente_id);
  };

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      alert("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({
      cliente_id:  values.cliente_id ? Number(values.cliente_id) : null,
      venta_id:    values.venta_id   ? Number(values.venta_id)   : null,
      empleado_id: empleadoActual?.id_empleado ?? null,
      direccion:   values.direccion?.trim(),
      barrio:      values.barrio?.trim(),
      referencias: values.referencias?.trim() || "",
    });
  };

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        {/* ── Cliente (solo en registro) ── */}
        {!isEdit && (
          <div className={styles.fullWidth}>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel} htmlFor="cliente_id">Cliente *</label>
              <select
                id="cliente_id"
                className={`${styles.select} ${errors.cliente_id ? styles.selectError : ""}`}
                {...reg("cliente_id", { required: "Debe seleccionar un cliente." })}
                onChange={handleClienteChange}
              >
                <option value="">— Selecciona un cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre}{c.numero_documento ? ` — ${c.numero_documento}` : ""}
                  </option>
                ))}
              </select>
              {errors.cliente_id && <span className={styles.errorMsg}>{errors.cliente_id.message}</span>}
            </div>
          </div>
        )}

        {/* ── Empleado responsable (autocompletado con el usuario en sesión) ── */}
        <div className={styles.fullWidth}>
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
        </div>

        {/* ── Venta asociada ── */}
        <div className={styles.fullWidth}>
          <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel} htmlFor="venta_id">
              Venta asociada <span className={styles.optional}>(opcional)</span>
            </label>
            <select
              id="venta_id"
              className={styles.select}
              {...reg("venta_id")}
              onChange={(e) => {
                register("venta_id").onChange(e); // notificar a RHF
                handleVentaChange(e);
              }}
            >
              <option value="">— Sin venta asociada —</option>
              {ventasFiltradas.map((v) => (
                <option key={v.id_venta} value={v.id_venta}>
                  {v.numero_venta} — ${Number(v.total).toLocaleString()}
                </option>
              ))}
            </select>
            {clienteSelId && ventasFiltradas.length === 0 && (
              <p className={styles.hint}>Este cliente no tiene ventas activas.</p>
            )}
          </div>
        </div>

        {/* ── Dirección ── */}
        <div className={styles.fullWidth}>
          <FormField
            label="Dirección *"
            name="direccion"
            type="text"
            placeholder="Se rellena al seleccionar cliente o venta"
            error={errors.direccion}
            {...reg("direccion", { required: "La dirección es obligatoria." })}
          />
        </div>

        {/* ── Barrio ── */}
        <div className={styles.fullWidth}>
          <FormField
            label="Barrio *"
            name="barrio"
            type="text"
            placeholder="Ej: El Poblado, Laureles…"
            error={errors.barrio}
            {...reg("barrio", { required: "El barrio es obligatorio." })}
          />
        </div>

        {/* ── Referencias ── */}
        <div className={styles.fullWidth}>
          <FormField
            label="Referencias (opcional)"
            name="referencias"
            type="text"
            placeholder="Ej: Casa azul, portón negro"
            {...reg("referencias")}
          />
        </div>

      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
