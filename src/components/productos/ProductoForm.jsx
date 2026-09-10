import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle, FiAlertTriangle, FiUploadCloud, FiList, FiX } from "react-icons/fi";
import FormField from "../forms/FormField";
import { resolveImageUrl } from "../../utils/image";
import styles from "./ProductoForm.module.css";

const REQUIRED = "Debe completar todos los campos requeridos.";
const MAX_IMGS = 3;

/** Convierte el campo imagen (string o array) a array de URLs resueltas */
const parseImagenes = (imagen, imagenes) => {
  if (Array.isArray(imagenes) && imagenes.length) return imagenes.map(resolveImageUrl).filter(Boolean);
  if (Array.isArray(imagen)) return imagen.map(resolveImageUrl).filter(Boolean);
  if (typeof imagen === "string" && imagen) {
    return imagen.split("|").map((r) => resolveImageUrl(r.trim())).filter(Boolean);
  }
  return [];
};

export default function ProductoForm({
  defaultValues = {},
  defaultReceta = [],
  categorias = [],
  insumos = [],
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const fileInputRef = useRef(null);

  // Previews: array de { src: string, file?: File } 
  // src = ObjectURL (nueva) o URL resuelta (existente)
  const [previews, setPreviews] = useState(() =>
    parseImagenes(defaultValues?.imagen, defaultValues?.imagenes).map((src) => ({ src }))
  );

  const [receta, setReceta] = useState(defaultReceta);
  const [insumoSel, setInsumoSel] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [recetaError, setRecetaError] = useState("");
  const [recetaMsg, setRecetaMsg] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      setPreviews(
        parseImagenes(defaultValues?.imagen, defaultValues?.imagenes).map((src) => ({ src }))
      );
      setReceta(defaultReceta || []);
    }, 0);
    return () => clearTimeout(timer);
  }, [defaultValues?.id_producto, defaultReceta?.length]);

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const disponibles = MAX_IMGS - previews.length;
    const nuevos = files.slice(0, disponibles).map((file) => ({
      src: URL.createObjectURL(file),
      file,
    }));
    setPreviews((prev) => [...prev, ...nuevos]);
    // reset input para permitir volver a elegir los mismos archivos
    e.target.value = "";
  };

  const handleRemoveImg = (idx) => {
    setPreviews((prev) => {
      const copy = [...prev];
      if (copy[idx].src.startsWith("blob:")) URL.revokeObjectURL(copy[idx].src);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleAgregarInsumo = () => {
    setRecetaError(""); setRecetaMsg("");
    if (!insumoSel) { setRecetaError("Selecciona un insumo."); return; }
    const cant = Number(cantidad);
    if (!cant || cant <= 0) { setRecetaError("La cantidad debe ser mayor a cero."); return; }
    if (receta.some((r) => r.insumo_id === Number(insumoSel))) {
      setRecetaError("El insumo ya está en la receta."); return;
    }
    const ins = insumos.find((i) => i.id_insumo === Number(insumoSel));
    if (!ins) return;
    setReceta((prev) => [...prev, {
      insumo_id: ins.id_insumo, nombre_insumo: ins.nombre_insumo,
      cantidad_requerida: cant, unidad: ins.unidad_medida,
    }]);
    setRecetaMsg("Insumo agregado a la receta.");
    setInsumoSel(""); setCantidad("");
    setTimeout(() => setRecetaMsg(""), 2500);
  };

  const handleEliminarInsumo = (insumo_id) =>
    setReceta((prev) => prev.filter((r) => r.insumo_id !== insumo_id));

  const onFormSubmit = (values) => {
    if (!values?.nombre?.trim()) return;
    if (!values?.categoria_id) return;
    const precio = parseFloat(values?.precio);
    if (isNaN(precio) || precio <= 0) return;
    const stock = parseFloat(values?.stock_producto);
    if (isNaN(stock) || stock < 0) return;

    const formData = new FormData();
    formData.append("nombre", values.nombre.trim());
    formData.append("categoria_id", Number(values.categoria_id));
    formData.append("precio", precio);
    formData.append("stock_producto", stock);
    formData.append("es_nuevo", values.es_nuevo ? "true" : "false");
    formData.append("es_temporada", values.es_temporada ? "true" : "false");
    formData.append("receta", JSON.stringify(
      receta.map((r) => ({ insumo_id: r.insumo_id, cantidad_requerida: r.cantidad_requerida }))
    ));

    // Agrega solo los archivos nuevos (File objects)
    const archivosNuevos = previews.filter((p) => p.file).map((p) => p.file);
    archivosNuevos.forEach((file) => formData.append("imagenes", file));
    formData.append("imagenes_existentes", JSON.stringify(
      previews.filter((preview) => !preview.file).map((preview) => preview.src)
    ));

    onSubmit(formData, receta);
  };

  const canAddMore = previews.length < MAX_IMGS;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>
      <div className={styles.grid}>

        {/* Nombre */}
        <div className={styles.fullWidth}>
          <FormField label="Nombre del producto *" name="nombre" type="text"
            placeholder="Ej: Pan de trigo" error={errors.nombre}
            {...reg("nombre", { required: REQUIRED, minLength: { value: 2, message: "Mínimo 2 caracteres." } })} />
        </div>

        {/* Categoría */}
        <FormField label="Categoría *" name="categoria_id" type="select"
          options={categorias.filter((c) => c.estado === "ACTIVO").map((c) => ({ value: c.id_categoria, label: c.nombre }))}
          error={errors.categoria_id} {...reg("categoria_id", { required: REQUIRED })} />

        {/* Precio */}
        <FormField label="Precio ($) *" name="precio" type="number" placeholder="0"
          error={errors.precio}
          {...reg("precio", { required: REQUIRED, min: { value: 0.01, message: "El precio debe ser mayor a cero." }, valueAsNumber: true })} />

        {/* Stock */}
        <FormField label="Stock *" name="stock_producto" type="number" placeholder="0"
          error={errors.stock_producto}
          {...reg("stock_producto", { required: REQUIRED, min: { value: 0, message: "El stock no puede ser negativo." }, valueAsNumber: true })} />

        {/* Imágenes */}
        <div className={styles.fullWidth}>
          <div className={styles.imgLabel}>
            <label className={styles.label}>
              Imágenes del producto
            </label>
            <span className={styles.imgCounter}>{previews.length} / {MAX_IMGS}</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            onChange={handleFileChange}
          />

          <div className={styles.previewGrid}>
            {previews.map((p, idx) => (
              <div key={idx} className={styles.previewItem}>
                <img src={p.src} alt={`imagen-${idx + 1}`} className={styles.previewImg} />
                {idx === 0 && <span className={styles.principalBadge}>Principal</span>}
                <button
                  type="button"
                  className={styles.removeImgBtn}
                  onClick={() => handleRemoveImg(idx)}
                  title="Eliminar imagen"
                >
                  <FiX />
                </button>
              </div>
            ))}

            {canAddMore && (
              <div
                className={styles.addImgSlot}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <FiUploadCloud className={styles.uploadIcon} />
                <span className={styles.uploadText}>
                  {previews.length === 0 ? "Agregar imágenes" : "Agregar más"}
                </span>
                <span className={styles.uploadHint}>PNG, JPG, WEBP · máx. 5 MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Destacados / Badges */}
        <div className={styles.badgesSection}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              {...reg("es_nuevo")}
            />
            <span>Marcar como &quot;Nuevo&quot;</span>
          </label>

          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              {...reg("es_temporada")}
            />
            <span>Marcar como &quot;Temporada&quot;</span>
          </label>
        </div>

      </div>

      {/* Receta */}
      <div className={styles.recetaSection}>
        <div className={styles.recetaHeader}>
          <p className={styles.sectionTitle}>
            <FiList className={styles.sectionTitleIcon} />
            Receta — Insumos requeridos
          </p>
          {receta.length > 0 && <span className={styles.recetaCount}>{receta.length}</span>}
        </div>

        <div className={styles.recetaBody}>
          {insumos.length === 0 ? (
            <p className={styles.noInsumos}>No hay insumos disponibles.</p>
          ) : (
            <div className={styles.recetaRow}>
              <select className={styles.insumoSelect} value={insumoSel}
                onChange={(e) => setInsumoSel(e.target.value)}>
                <option value="">— Seleccionar insumo —</option>
                {insumos.filter((i) => i.estado === "ACTIVO").map((i) => (
                  <option key={i.id_insumo} value={i.id_insumo}>
                    {i.nombre_insumo} ({i.unidad_medida})
                  </option>
                ))}
              </select>
              <input type="number" min="0.01" step="any" placeholder="Cantidad"
                className={styles.numInput} value={cantidad}
                onChange={(e) => setCantidad(e.target.value)} />
              <button type="button" className={styles.addBtn} onClick={handleAgregarInsumo}>
                <FiPlusCircle /> Agregar
              </button>
            </div>
          )}

          {recetaMsg   && <p className={styles.msgOk}>✓ {recetaMsg}</p>}
          {recetaError && <p className={styles.msgError}><FiAlertTriangle />{recetaError}</p>}

          {receta.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Insumo</th><th>Cantidad requerida</th><th></th></tr>
                </thead>
                <tbody>
                  {receta.map((r) => (
                    <tr key={r.insumo_id}>
                      <td>{r.nombre_insumo}</td>
                      <td>{r.cantidad_requerida}<span className={styles.unitBadge}>{r.unidad}</span></td>
                      <td>
                        <button type="button" className={styles.removeBtn}
                          onClick={() => handleEliminarInsumo(r.insumo_id)} title="Eliminar">
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? <><span className={styles.spinner} /> Guardando…</> : submitLabel}
        </button>
      </div>
    </form>
  );
}
