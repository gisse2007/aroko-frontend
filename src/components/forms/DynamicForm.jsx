import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "./FormField";
import styles from "./DynamicForm.module.css";

/**
 * @param {Object[]} fields  - configuración de campos (ver fieldSchema.js)
 * @param {Function} onSubmit - (data) => void
 * @param {Function} onCancel - () => void
 * @param {Object}   defaultValues - valores iniciales para edición
 * @param {string}   submitLabel
 */
export default function DynamicForm({
  fields = [],
  onSubmit,
  onCancel,
  defaultValues = {},
  submitLabel = "Guardar",
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  // Sincroniza valores cuando se abre en modo edición
  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>
        {fields.map((field) => {
          const { name, ...fieldProps } = field;
          const { ref, ...registered } = register(name, buildRules(field));

          return (
            <div
              key={name}
              className={field.fullWidth ? styles.fullWidth : ""}
            >
              <FormField
                {...fieldProps}
                {...registered}
                ref={ref}
                name={name}
                error={errors[name]}
              />
            </div>
          );
        })}
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

/* ── Construye las reglas de validación desde la config del campo ── */
function buildRules(field) {
  const rules = {};

  if (field.required) {
    rules.required = typeof field.required === "string"
      ? field.required
      : `${field.label ?? field.name} es requerido`;
  }

  if (field.type === "number" || field.type === "positiveNumber") {
    rules.min = {
      value: field.min ?? 0,
      message: `El valor mínimo es ${field.min ?? 0}`,
    };
    if (field.max !== undefined) {
      rules.max = { value: field.max, message: `El valor máximo es ${field.max}` };
    }
    rules.valueAsNumber = true;
  }

  if (field.type === "email") {
    rules.pattern = {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Correo electrónico inválido",
    };
  }

  if (field.type === "tel") {
    rules.pattern = {
      value: /^\d{1,10}$/,
      message: "El teléfono debe tener máximo 10 dígitos.",
    };
    rules.maxLength = {
      value: 10,
      message: "Máximo 10 dígitos.",
    };
  }

  if (field.minLength) {
    rules.minLength = {
      value: field.minLength,
      message: `Mínimo ${field.minLength} caracteres`,
    };
  }

  if (field.maxLength) {
    rules.maxLength = {
      value: field.maxLength,
      message: `Máximo ${field.maxLength} caracteres`,
    };
  }

  if (field.pattern) {
    rules.pattern = field.pattern;
  }

  return rules;
}
