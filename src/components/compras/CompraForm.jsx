import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiTrash2, FiPlusCircle, FiUpload } from "react-icons/fi";
import FormField from "../forms/FormField";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";
import { formatCantidad } from "../../utils/number";
import styles from "./CompraForm.module.css";

const IVA_OPTS = [
  { value: "0",  label: "0%" },
  { value: "5",  label: "5%" },
  { value: "19", label: "19%" },
];

export default function CompraForm({
  proveedores = [],
  insumosDisponibles = [],
  empleados = [],
  onSubmit,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { iva: "19" } });

  // El responsable se vincula automáticamente al usuario autenticado.
  const empleadoActual = useEmpleadoActual(empleados);

  const [detalle, setDetalle]           = useState([]);
  const [insumoSel, setInsumoSel]       = useState("");
  const [cantComprada, setCantComprada] = useState("");
  const [contenido, setContenido]       = useState("");
  const [precio, setPrecio]             = useState("");
  const [detalleError, setDetalleError] = useState("");
  const [insumoMsg, setInsumoMsg]       = useState("");
  const [fotoFile, setFotoFile]         = useState(null);
  const [fotoNombre, setFotoNombre]     = useState("");

  const ivaVal = Number(watch("iva") ?? 19);

  /* ── Insumo actualmente seleccionado (para unidad y vista previa) ── */
  const insumoActivo = insumosDisponibles.find((i) => i.id_insumo === Number(insumoSel)) ?? null;
  const unidadActiva = insumoActivo?.unidad_medida ?? "";

  /* ── Vista previa del cálculo ── */
  const prevCant = Number(cantComprada);
  const prevCont = Number(contenido);
  const prevStock = prevCant > 0 && prevCont > 0 ? prevCant * prevCont : null;

  /* ── Cálculos ── */
  const subtotalBase = detalle.reduce((a, d) => a + d.subtotal, 0);
  const ivaCalc      = subtotalBase * (ivaVal / 100);
  const total        = subtotalBase + ivaCalc;

  /* ── Agregar insumo al detalle ── */
  const handleAgregarInsumo = () => {
    setDetalleError("");
    setInsumoMsg("");

    if (!insumoSel) { setDetalleError("Selecciona un insumo."); return; }

    const cant = Number(cantComprada);
    const cont = Number(contenido);
    const prec = Number(precio);

    if (!cant || cant <= 0) {
      setDetalleError("La cantidad comprada debe ser mayor a 0.");
      return;
    }
    if (!cont || cont <= 0) {
      setDetalleError("El contenido debe ser mayor a 0.");
      return;
    }
    if (!prec || prec <= 0) {
      setDetalleError("El precio unitario debe ser mayor a 0.");
      return;
    }
    if (detalle.some((d) => d.insumo_id === Number(insumoSel))) {
      setDetalleError("El insumo ya fue agregado a la compra.");
      return;
    }

    const ins = insumosDisponibles.find((i) => i.id_insumo === Number(insumoSel));
    if (!ins) return;

    // stock_ingresado = cantidad comprada × contenido por presentación
    const stockIngresado = cant * cont;

    setDetalle((prev) => [
      ...prev,
      {
        insumo_id:       ins.id_insumo,
        nombre_insumo:   ins.nombre_insumo,
        unidad_medida:   ins.unidad_medida,
        cantidad:        cant,
        contenido:       cont,
        stock_ingresado: stockIngresado,
        precio:          prec,
        subtotal:        cant * prec,
      },
    ]);
    setInsumoMsg("Insumo agregado correctamente.");
    setInsumoSel(""); setCantComprada(""); setContenido(""); setPrecio("");
    setTimeout(() => setInsumoMsg(""), 2500);
  };

  /* ── Eliminar insumo del detalle ── */
  const handleEliminarInsumo = (insumo_id) => {
    setDetalle((prev) => prev.filter((d) => d.insumo_id !== insumo_id));
  };

  /* ── Foto factura ── */
  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setDetalleError("Solo se aceptan archivos PDF o JPG.");
      return;
    }
    setFotoNombre(file.name);
    setFotoFile(file);
  };

  /* ── Submit ── */
  const onFormSubmit = (values) => {
    if (!empleadoActual) {
      setDetalleError("Error: No se encontró un empleado vinculado al usuario autenticado.");
      return;
    }
    if (detalle.length === 0) {
      setDetalleError("Debe agregar al menos un insumo.");
      return;
    }
    // Se envía el empleado vinculado al usuario en sesión (no editable).
    onSubmit({ ...values, empleado_id: empleadoActual?.id_empleado ?? null }, detalle, fotoFile);
  };

  const reg = (name, rules) => {
    const { ref, ...rest } = register(name, rules);
    return { ref, ...rest };
  };

  const REQUIRED = "Este campo es obligatorio.";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className={styles.form}>

      {/* ── Datos principales ── */}
      <div className={styles.grid}>
        <FormField
          label="Proveedor *"
          name="proveedor_id"
          type="select"
          options={proveedores
            .filter((p) => p.estado === "ACTIVO")
            .map((p) => ({ value: p.id_proveedor, label: p.nombre_proveedor }))}
          error={errors.proveedor_id}
          {...reg("proveedor_id", { required: REQUIRED })}
        />
        <FormField
          label="Fecha de compra *"
          name="fecha_compra"
          type="date"
          error={errors.fecha_compra}
          {...reg("fecha_compra", { required: REQUIRED })}
        />
        <FormField
          label="N° Factura *"
          name="numero_factura"
          type="text"
          placeholder="FAC-000"
          error={errors.numero_factura}
          {...reg("numero_factura", { required: REQUIRED })}
        />
        <FormField
          label="IVA *"
          name="iva"
          type="select"
          options={IVA_OPTS}
          error={errors.iva}
          {...reg("iva", { required: REQUIRED })}
        />
        {/* Responsable autocompletado con el usuario en sesión (solo lectura) */}
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

      {/* ── Foto factura ── */}
      <div className={styles.uploadWrap}>
        <label className={styles.uploadLabel}>
          <FiUpload /> Adjuntar factura (PDF / JPG — opcional)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg"
            className={styles.fileInput}
            onChange={handleFoto}
          />
        </label>
        {fotoNombre && <span className={styles.fileName}>{fotoNombre}</span>}
      </div>

      {/* ── Agregar insumos ── */}
      <div className={styles.insumoSection}>
        <p className={styles.sectionTitle}>Detalle de insumos</p>

        {insumosDisponibles.length === 0 ? (
          <p className={styles.noInsumos}>No hay insumos disponibles para agregar.</p>
        ) : (
          <>
            <div className={styles.insumoRow}>
              <div className={styles.insumoField}>
                <label className={styles.insumoLabel}>Insumo</label>
                <select
                  className={styles.insumoSelect}
                  value={insumoSel}
                  onChange={(e) => setInsumoSel(e.target.value)}
                >
                  <option value="">— Seleccionar insumo —</option>
                  {insumosDisponibles
                    .filter((i) => i.estado === "ACTIVO")
                    .map((i) => (
                      <option key={i.id_insumo} value={i.id_insumo}>
                        {i.nombre_insumo} ({i.unidad_medida})
                      </option>
                    ))}
                </select>
              </div>
              <div className={styles.insumoField}>
                <label className={styles.insumoLabel}>Cantidad comprada</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="N° de presentaciones"
                  className={styles.numInput}
                  value={cantComprada}
                  onChange={(e) => setCantComprada(e.target.value)}
                />
              </div>
              <div className={styles.insumoField}>
                <label className={styles.insumoLabel}>
                  Contenido{unidadActiva && <span className={styles.unidadBadge}>{unidadActiva}</span>}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder={unidadActiva ? `Ej: 100 ${unidadActiva}` : "Por presentación"}
                  className={styles.numInput}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                />
              </div>
              <div className={styles.insumoField}>
                <label className={styles.insumoLabel}>Precio unit. ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="Por presentación"
                  className={styles.numInput}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
            </div>
            {prevStock !== null && (
              <div className={styles.previewCalc}>
                <span className={styles.previewIcon}>📦</span>
                <span>
                  Stock que ingresará al inventario:{" "}
                  <strong>{prevStock.toLocaleString()} {unidadActiva}</strong>
                  {" "}({prevCant.toLocaleString()} × {prevCont.toLocaleString()} {unidadActiva})
                </span>
              </div>
            )}
            <div className={styles.insumoRowBtn}>
              <button type="button" className={styles.addInsumoBtn} onClick={handleAgregarInsumo}>
                <FiPlusCircle /> Agregar insumo
              </button>
            </div>
          </>
        )}

        {insumoMsg    && <p className={styles.insumoOk}>{insumoMsg}</p>}
        {detalleError && <p className={styles.detalleError}>⚠ {detalleError}</p>}

        {/* Tabla de insumos agregados */}
        {detalle.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Cant. comprada</th>
                  <th>Contenido</th>
                  <th>Unidad</th>
                  <th>Stock ingresado</th>
                  <th>Precio unit.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d) => {
                  const stockIngresado = d.stock_ingresado != null
                    ? Number(d.stock_ingresado)
                    : Number(d.cantidad) * Number(d.contenido || 0);

                  return (
                    <tr key={d.insumo_id}>
                      <td>{d.nombre_insumo}</td>
                      <td>{formatCantidad(d.cantidad)}</td>
                      <td>{Number(d.contenido).toLocaleString()}</td>
                      <td>{d.unidad_medida}</td>
                      <td>{stockIngresado.toLocaleString()} {d.unidad_medida}</td>
                      <td>${Number(d.precio).toLocaleString()}</td>
                      <td>${Number(d.subtotal).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleEliminarInsumo(d.insumo_id)}
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totales */}
            <div className={styles.totales}>
              <span>Subtotal: <b>${subtotalBase.toLocaleString()}</b></span>
              <span>IVA ({ivaVal}%): <b>${ivaCalc.toLocaleString()}</b></span>
              <span className={styles.totalFinal}>Total: <b>${total.toLocaleString()}</b></span>
            </div>
          </div>
        )}
      </div>

      {/* ── Acciones ── */}
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}
