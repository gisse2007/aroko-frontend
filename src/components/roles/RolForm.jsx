import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import styles from "../forms/DynamicForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function RolForm({
  defaultValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.fullWidth}>
          <FormField
            label="Nombre del rol *"
            name="nombre"
            type="text"
            placeholder="Ej: Administrador"
            error={errors.nombre}
            {...register("nombre", {
              required: REQUIRED,
              minLength: { value: 3,  message: "Mínimo 3 caracteres." },
              maxLength: { value: 60, message: "Máximo 60 caracteres." },
            })}
          />
        </div>
        <div className={styles.fullWidth}>
          <FormField
            label="Descripción *"
            name="descripcion"
            type="textarea"
            placeholder="Describe las responsabilidades de este rol…"
            error={errors.descripcion}
            {...register("descripcion", {
              required: REQUIRED,
              maxLength: { value: 200, message: "Máximo 200 caracteres." },
            })}
          />
        </div>
      </div>

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
