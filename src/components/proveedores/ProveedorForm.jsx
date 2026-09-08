import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { useToast } from "../../hooks/useToast";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import styles from "../forms/DynamicForm.module.css";

const REQUIRED_MSG = "Todos los campos obligatorios deben ser diligenciados.";

export default function ProveedorForm({ defaultValues = {}, empleados = [], onSubmit, onCancel, submitLabel = "Guardar" }) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const handlePhoneLimitReached = () => show("El teléfono no puede exceder 10 dígitos.", "info");

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      alert("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        <div className={styles.fullWidth}>
          <FormField
            label="Nombre del proveedor *"
            name="nombre_proveedor"
            type="text"
            placeholder="Nombre del proveedor"
            error={errors.nombre_proveedor}
            {...reg("nombre_proveedor", {
              required: REQUIRED_MSG,
              minLength: { value: 3, message: "Mínimo 3 caracteres" },
              maxLength: { value: 100, message: "Máximo 100 caracteres" },
            })}
          />
        </div>

        <div className={styles.fullWidth}>
          <FormField
            label="Dirección *"
            name="direccion"
            type="text"
            placeholder="Dirección completa"
            error={errors.direccion}
            {...reg("direccion", {
              required: REQUIRED_MSG,
              minLength: { value: 5, message: "Mínimo 5 caracteres" },
            })}
          />
        </div>

        <FormField
          label="Teléfono (opcional)"
          name="telefono"
          type="tel"
          placeholder="310-000-0000"
          error={errors.telefono}
          onPhoneLimitReached={handlePhoneLimitReached}
          {...reg("telefono", {
            maxLength: { value: 10, message: "Máximo 10 dígitos." },
            pattern: { value: /^\d{1,10}$|^$/, message: "El teléfono debe tener máximo 10 dígitos." },
          })}
        />

        <FormField
          label="Email (opcional)"
          name="email"
          type="email"
          placeholder="correo@ejemplo.com"
          error={errors.email}
          {...reg("email", {
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo electrónico inválido" },
          })}
        />

        {/* Responsable autocompletado con el usuario en sesión (solo lectura) */}
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
