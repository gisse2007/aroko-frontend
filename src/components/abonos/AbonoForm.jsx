import { useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { METODOS_PAGO } from "../../hooks/useAbonos";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "./AbonoForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function AbonoForm({ ventas = [], empleados = [], ventaPreseleccionada = null, onSubmit, onCancel }) {
  const [ventaId,   setVentaId]   = useState(ventaPreseleccionada?.id_venta ?? "");
  const [ventaInfo, setVentaInfo] = useState(ventaPreseleccionada ?? null);

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fecha_abono: new Date().toISOString().split("T")[0] },
  });

  const valorAbono = Number(watch("valor_abono") ?? 0);
  const saldo      = Number(ventaInfo?.saldo ?? 0);
  const abonado    = Number(ventaInfo?.abonado ?? 0);
  const total      = Number(ventaInfo?.total ?? 0);
  const saldoResultante = saldo - (valorAbono > 0 ? valorAbono : 0);

  const handleSelectVenta = (e) => {
    const id = e.target.value;
    setVentaId(id);
    const v = ventas.find((x) => x.id_venta === Number(id));
    setVentaInfo(v ?? null);
  };

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      console.error("No se encontró un empleado vinculado al usuario autenticado.");
      alert("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    if (!ventaId) return;
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null }, ventaId);
  };

  const ventasActivas = ventas.filter((v) => v.estado === "REGISTRADA");

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>

      {/* ── Selector de venta (si no viene preseleccionada) ── */}
      {!ventaPreseleccionada && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>
            Seleccionar venta *
          </label>
          <select
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: "0.875rem" }}
            value={ventaId}
            onChange={handleSelectVenta}
          >
            <option value="">— Seleccionar venta —</option>
            {ventasActivas.map((v) => (
              <option key={v.id_venta} value={v.id_venta}>
                {v.numero_venta} — {v.cliente_nombre} (Saldo: ${Number(v.saldo).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Resumen de la venta ── */}
      {ventaInfo && (
        <div className={styles.resumen}>
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>Cliente</span>
            <span className={styles.resumenValue}>{ventaInfo.cliente_nombre}</span>
          </div>
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>N° Venta</span>
            <span className={styles.resumenValue}>{ventaInfo.numero_venta}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>Total de la venta</span>
            <span className={styles.resumenValue}>${total.toLocaleString()}</span>
          </div>
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>Total abonado</span>
            <span className={styles.resumenValue}>${abonado.toLocaleString()}</span>
          </div>
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>Saldo pendiente</span>
            <span className={`${styles.resumenValue} ${saldo === 0 ? styles.saldoCero : styles.saldoPendiente}`}>
              ${saldo.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {ventaInfo && saldo === 0 ? (
        <p className={styles.pagado}>Esta venta ya se encuentra pagada en su totalidad.</p>
      ) : ventaInfo ? (
        <>
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

            <FormField label="Fecha del abono *" name="fecha_abono" type="date"
              error={errors.fecha_abono} {...reg("fecha_abono", { required: REQUIRED })} />

            <FormField label="Método de pago *" name="metodo_pago" type="select"
              options={METODOS_PAGO.map((m) => ({ value: m, label: m }))}
              error={errors.metodo_pago} {...reg("metodo_pago", { required: REQUIRED })} />

            <div className={styles.fullWidth}>
              <FormField label="Valor del abono *" name="valor_abono" type="number" placeholder="0"
                error={errors.valor_abono}
                {...reg("valor_abono", {
                  required: REQUIRED,
                  min: { value: 1, message: "El valor debe ser mayor a cero." },
                  valueAsNumber: true,
                  validate: (v) => Number(v) <= saldo || `El valor supera el saldo pendiente ($${saldo.toLocaleString()}).`,
                })} />
              {valorAbono > 0 && valorAbono <= saldo && (
                <p className={styles.saldoPreview}>
                  Saldo después del abono:{" "}
                  <strong className={saldoResultante === 0 ? styles.saldoCero : styles.saldoPendiente}>
                    ${saldoResultante.toLocaleString()}
                  </strong>
                </p>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            {onCancel && (
              <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
            )}
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !ventaId}>
              {isSubmitting ? "Registrando…" : "Registrar abono"}
            </button>
          </div>
        </>
      ) : null}

    </form>
  );
}
