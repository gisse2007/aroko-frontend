import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import styles from "../forms/DynamicForm.module.css";

export default function CategoriaInsumoForm({
  defaultValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.fullWidth}>
          <FormField
            label="Nombre de la categoría *"
            name="nombre"
            type="text"
            placeholder="Ej: Lácteos, Granos, Aceites…"
            error={errors.nombre}
            {...reg("nombre", {
              required: "El nombre de la categoría es obligatorio.",
              minLength: { value: 3,   message: "El nombre debe tener entre 3 y 120 caracteres." },
              maxLength: { value: 120, message: "El nombre debe tener entre 3 y 120 caracteres." },
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
