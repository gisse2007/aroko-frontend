import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { useToast } from "../../hooks/useToast";
import { TIPOS_DOCUMENTO } from "../../hooks/useClientes";
import styles from "../forms/DynamicForm.module.css";

const REQUIRED = "Error: Debe completar todos los campos obligatorios.";

export default function ClienteForm({
  defaultValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const handlePhoneLimitReached = () => show("El teléfono no puede exceder 10 dígitos.", "info");
  const handleDocumentLimitReached = () => show("El número de documento no puede exceder 11 dígitos.", "info");

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        <div className={styles.fullWidth}>
          <FormField
            label="Nombre completo *"
            name="nombre"
            type="text"
            placeholder="Nombre del cliente"
            error={errors.nombre}
            {...reg("nombre", {
              required: REQUIRED,
              minLength: { value: 3, message: "Mínimo 3 caracteres." },
              maxLength: { value: 100, message: "Máximo 100 caracteres." },
            })}
          />
        </div>

        <FormField
          label="Tipo de documento *"
          name="tipo_documento"
          type="select"
          options={TIPOS_DOCUMENTO.map((t) => ({ value: t, label: t }))}
          error={errors.tipo_documento}
          {...reg("tipo_documento", { required: REQUIRED })}
        />

        <FormField
          label="Número de documento *"
          name="numero_documento"
          type="text"
          placeholder="Ej: 1020304050"
          maxLength={11}
          error={errors.numero_documento}
          onMaxLengthReached={handleDocumentLimitReached}
          {...reg("numero_documento", {
            required: REQUIRED,
            maxLength: { value: 11, message: "Máximo 11 dígitos." },
            pattern: { value: /^\d{1,11}$/, message: "Solo números, máx. 11 dígitos." },
          })}
        />

        <FormField
          label="Teléfono *"
          name="telefono"
          type="tel"
          placeholder="310-000-0000"
          error={errors.telefono}
          onMaxLengthReached={handlePhoneLimitReached}
          {...reg("telefono", {
            required: REQUIRED,
            maxLength: { value: 10, message: "Máximo 10 dígitos." },
            pattern: { value: /^\d{1,10}$/, message: "El teléfono debe tener máximo 10 dígitos." },
          })}
        />

        <FormField
          label="Correo electrónico *"
          name="email"
          type="email"
          placeholder="correo@ejemplo.com"
          error={errors.email}
          {...reg("email", {
            required: REQUIRED,
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo electrónico inválido." },
          })}
        />

        <div className={styles.fullWidth}>
          <FormField
            label="Dirección *"
            name="direccion"
            type="text"
            placeholder="Dirección completa"
            error={errors.direccion}
            {...reg("direccion", {
              required: REQUIRED,
              minLength: { value: 5, message: "Mínimo 5 caracteres." },
            })}
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
