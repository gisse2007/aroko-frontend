import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormField from "../forms/FormField";
import { useToast } from "../../hooks/useToast";
import { TIPOS_DOCUMENTO_EMP } from "../../hooks/useEmpleados";
import styles from "../forms/DynamicForm.module.css";

const REQUIRED = "Debe completar todos los campos requeridos.";

export default function EmpleadoForm({
  defaultValues = {},
  roles = [],
  rolesLoading = false,
  isEdit = false,
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

        {/* nombre */}
        <div className={styles.fullWidth}>
          <FormField
            label="Nombre completo *"
            name="nombre"
            type="text"
            placeholder="Nombre del empleado"
            error={errors.nombre}
            {...reg("nombre", {
              required: REQUIRED,
              minLength: { value: 3,   message: "Mínimo 3 caracteres." },
              maxLength: { value: 100, message: "Máximo 100 caracteres." },
            })}
          />
        </div>

        {/* tipo_documento */}
        <FormField
          label="Tipo de documento *"
          name="tipo_documento"
          type="select"
          options={TIPOS_DOCUMENTO_EMP.map((t) => ({ value: t, label: t }))}
          error={errors.tipo_documento}
          {...reg("tipo_documento", { required: REQUIRED })}
        />

        {/* documento */}
        <FormField
          label="Número de documento *"
          name="documento"
          type="text"
          placeholder="Ej: 1020304050"
          maxLength={11}
          error={errors.documento}
          onMaxLengthReached={handleDocumentLimitReached}
          {...reg("documento", {
            required: REQUIRED,
            maxLength: { value: 11, message: "Máximo 11 dígitos." },
            pattern: { value: /^\d{1,11}$/, message: "Solo números, máx. 11 dígitos." },
          })}
        />

        {/* telefono */}
        <FormField
          label="Teléfono (opcional)"
          name="telefono"
          type="tel"
          placeholder="310-000-0000"
          error={errors.telefono}
          onMaxLengthReached={handlePhoneLimitReached}
          {...reg("telefono", {
            maxLength: { value: 10, message: "Máximo 10 dígitos." },
            pattern: { value: /^\d{1,10}$|^$/, message: "El teléfono debe tener máximo 10 dígitos." },
          })}
        />

        {/* dirección */}
        <div className={styles.fullWidth}>
          <FormField
            label="Dirección (opcional)"
            name="direccion"
            type="text"
            placeholder="Calle 123 #45-67, Apt 890"
            error={errors.direccion}
            {...reg("direccion", {
              maxLength: { value: 255, message: "Máximo 255 caracteres." },
            })}
          />
        </div>

        {/* email */}
        <FormField
          label="Correo personal (opcional)"
          name="email"
          type="email"
          placeholder="empleado@correo.com"
          error={errors.email}
          {...reg("email", {
            pattern: { value: /^[^\s@]*@[^\s@]*\.[^\s@]*$|^$/, message: "Correo inválido." },
          })}
        />

        {/* salario */}
        <FormField
          label="Salario (opcional)"
          name="salario"
          type="number"
          placeholder="0.00"
          error={errors.salario}
          {...reg("salario", {
            min: { value: 0, message: "El salario no puede ser negativo." },
            pattern: { value: /^\d+(\.\d{1,2})?$|^$/, message: "Formato de salario inválido." },
          })}
        />

        {/* fecha_ingreso */}
        <FormField
          label="Fecha de ingreso (opcional)"
          name="fecha_ingreso"
          type="date"
          error={errors.fecha_ingreso}
          {...reg("fecha_ingreso")}
        />

        <div className={styles.sectionTitle}>Acceso al sistema</div>
        <FormField
          label="Rol en el sistema *"
          name="rol_id"
          type="select"
          options={roles.map((role) => ({ value: role.id_rol, label: role.nombre }))}
          disabled={rolesLoading}
          error={errors.rol_id}
          {...reg("rol_id", { required: REQUIRED })}
        />

        {!isEdit && (
          <div className={styles.fullWidth}>
            <FormField
              label="Correo de acceso *"
              name="correo_acceso"
              type="email"
              placeholder="usuario@aroko.com"
              error={errors.correo_acceso}
              {...reg("correo_acceso", {
                required: REQUIRED,
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo inválido." },
              })}
            />
          </div>
        )}

        {!isEdit && (
          <div className={styles.fullWidth}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
              La contraseña será generada automáticamente por el sistema y enviada al correo de acceso indicado.
            </p>
          </div>
        )}

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
