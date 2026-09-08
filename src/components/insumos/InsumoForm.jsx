import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArchive, FiPlusCircle } from "react-icons/fi";
import FormField from "../forms/FormField";
import styles from "../forms/DynamicForm.module.css";
import tipoStyles from "./InsumoForm.module.css";

const REQUIRED_MSG = "Debe completar todos los campos obligatorios.";

const UNIDADES = [
  { value: "kg",  label: "Kilogramo (kg)" },
  { value: "lt",  label: "Litro (lt)" },
  { value: "gr",  label: "Gramo (gr)" },
  { value: "und", label: "Unidad (und)" },
  { value: "ml",  label: "Mililitro (ml)" },
];

export default function InsumoForm({ defaultValues = {}, categorias = [], onSubmit, onCancel, submitLabel = "Guardar" }) {
  // Solo mostrar selector de tipo cuando es creación (sin defaultValues con id)
  const isEdit = !!defaultValues?.id_insumo;
  const [tipo, setTipo] = useState(isEdit ? "bodega" : null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  useEffect(() => { reset(defaultValues); }, [JSON.stringify(defaultValues)]);

  const stockActual = watch("stock_actual");
  const stockMinimo = watch("stock_minimo");
  const showStockAlert =
    stockActual !== "" && stockMinimo !== "" &&
    Number(stockActual) < Number(stockMinimo) &&
    Number(stockActual) >= 0 && Number(stockMinimo) >= 0;

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  // Si es edición, mostrar formulario completo directamente
  if (isEdit || tipo !== null) {
    const esBodega = isEdit || tipo === "bodega";

    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.grid}>

          <div className={styles.fullWidth}>
            <FormField
              label="Nombre del insumo *"
              name="nombre_insumo"
              type="text"
              placeholder="Nombre del insumo"
              error={errors.nombre_insumo}
              {...reg("nombre_insumo", {
                required: REQUIRED_MSG,
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 100, message: "Máximo 100 caracteres" },
              })}
            />
          </div>

          <FormField
            label="Categoría *"
            name="categoria_id"
            type="select"
            options={categorias.map((c) => ({ value: c.id_categoria, label: c.nombre }))}
            error={errors.categoria_id}
            {...reg("categoria_id", { required: REQUIRED_MSG })}
          />

          <FormField
            label="Unidad de medida *"
            name="unidad_medida"
            type="select"
            options={UNIDADES}
            error={errors.unidad_medida}
            {...reg("unidad_medida", { required: REQUIRED_MSG })}
          />

          {/* Stock solo para insumo de bodega */}
          {esBodega && (
            <FormField
              label="Stock actual *"
              name="stock_actual"
              type="number"
              placeholder="0"
              error={errors.stock_actual}
              {...reg("stock_actual", {
                required: REQUIRED_MSG,
                min: { value: 0, message: "El stock no puede ser negativo." },
                valueAsNumber: true,
              })}
            />
          )}

          <FormField
            label="Stock mínimo *"
            name="stock_minimo"
            type="number"
            placeholder="0"
            error={errors.stock_minimo}
            {...reg("stock_minimo", {
              required: REQUIRED_MSG,
              min: { value: 0, message: "El stock no puede ser negativo." },
              valueAsNumber: true,
            })}
          />

          <FormField
            label="Precio unitario ($) *"
            name="precio_unitario"
            type="number"
            placeholder="0"
            error={errors.precio_unitario}
            {...reg("precio_unitario", {
              required: REQUIRED_MSG,
              min: { value: 0.01, message: "El precio debe ser mayor a cero." },
              valueAsNumber: true,
            })}
          />

        </div>

        {showStockAlert && esBodega && (
          <div className={styles.stockAlert}>
            ⚠ El insumo se encuentra por debajo del stock mínimo.
          </div>
        )}

        <div className={styles.actions}>
          {!isEdit && (
            <button type="button" className={styles.cancelBtn} onClick={() => setTipo(null)}>
              ← Volver
            </button>
          )}
          {onCancel && isEdit && (
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

  // Selector inicial: bodega o nuevo
  return (
    <div className={styles.form}>
      <p style={{ fontSize: "0.875rem", color: "#555", marginBottom: 16 }}>
        ¿Qué tipo de insumo deseas registrar?
      </p>
      <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
        <button
          type="button"
          className={`${tipoStyles.tipoBtn} ${tipoStyles.tipoBtnActivo}`}
          onClick={() => setTipo("bodega")}
        >
          <span className={tipoStyles.tipoBtnIcon}><FiArchive /></span>
          Insumo de bodega — ingresar / actualizar stock
        </button>
        <button
          type="button"
          className={tipoStyles.tipoBtn}
          onClick={() => setTipo("nuevo")}
        >
          <span className={tipoStyles.tipoBtnIcon}><FiPlusCircle /></span>
          Insumo nuevo — registrar sin stock inicial
        </button>
      </div>
      {onCancel && (
        <div className={styles.actions} style={{ marginTop: 16 }}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
