import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { useToast } from "../../hooks/useToast";
import styles from "../forms/DynamicForm.module.css";

const REQUIRED = "Este campo es obligatorio.";

export default function UsuarioForm({
  defaultValues = {},
  roles = [],
  isEdit = false,
  isProfile = false,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const { show } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });
  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]); // eslint-disable-line

  const handlePhoneLimitReached = () => show("El teléfono no puede exceder 10 dígitos.", "info");

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        {/* Nombre */}
        <FormField label="Nombre" name="nombre_usuario" type="text" placeholder="Nombre completo"
          error={errors.nombre_usuario} {...reg("nombre_usuario", {
            maxLength: { value: 100, message: "Máximo 100 caracteres." },
          })} />

        {/* Teléfono */}
        <FormField label="Teléfono" name="telefono" type="tel" placeholder="300 000 0000"
          error={errors.telefono} onPhoneLimitReached={handlePhoneLimitReached} {...reg("telefono", {
            maxLength: { value: 10, message: "Máximo 10 dígitos." },
            pattern: { value: /^\d{1,10}$|^$/, message: "El teléfono debe tener máximo 10 dígitos." },
          })} />

        {/* Correo */}
        <div className={styles.fullWidth}>
          <FormField label="Correo electrónico *" name="correo" type="email" placeholder="correo@aroko.com"
            error={errors.correo}
            {...reg("correo", {
              required: REQUIRED,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo inválido." },
            })} />
        </div>

        {!isEdit && (
          <div className={styles.fullWidth}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
              La contraseña será generada automáticamente por el sistema y enviada al correo indicado.
            </p>
          </div>
        )}

        {/* Solo admin */}
        {!isProfile && (
          <>
            <FormField label="Rol *" name="rol_id" type="select"
              options={roles.map((r) => ({ value: r.id_rol, label: r.nombre }))}
              error={errors.rol_id} {...reg("rol_id", { required: REQUIRED })} />

            {isEdit && (
              <FormField label="Estado *" name="estado" type="select"
                options={[{ value: "ACTIVO", label: "Activo" }, { value: "INACTIVO", label: "Inactivo" }]}
                error={errors.estado} {...reg("estado", { required: REQUIRED })} />
            )}

          </>
        )}

      </div>

      <div className={styles.actions}>
        {onCancel && <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
