import { FiAlertTriangle, FiList } from "react-icons/fi";
import styles from "../Detalle.module.css";
import { STOCK_MINIMO } from "../../hooks/useProductos";
import { resolveImageUrl } from "../../utils/image";
import { formatCantidad } from "../../utils/number";

const Field = ({ label, value, full, highlight }) => (
  <div
    className={`${styles.fieldCard} ${full ? styles.fieldFull : ""} ${highlight ? styles.highlight : ""}`}
  >
    <span className={styles.fieldLabel}>{label}</span>
    <span
      className={`${styles.fieldValue} ${highlight ? styles.danger : ""} ${!value ? styles.muted : ""}`}
    >
      {value ?? "—"}
    </span>
  </div>
);

export default function ProductoDetalle({ producto }) {
  if (!producto) {
    return <p className={styles.notFound}>Producto no encontrado.</p>;
  }

  const {
    nombre,
    descripcion,
    categoria_nombre,
    precio,
    stock_producto,
    estado,
    receta = [],
    stock_bajo,
    imagen,
    imagenes,
  } = producto;

  const stockBajo = stock_bajo || stock_producto < STOCK_MINIMO;

  // Puede llegar como array `imagenes` (varias) o como `imagen` único/pipe-joined
  const listaImagenes = (
    Array.isArray(imagenes) && imagenes.length
      ? imagenes
      : imagen
        ? String(imagen).split("|")
        : []
  ).map((src) => resolveImageUrl(src)).filter(Boolean);

  return (
    <div className={styles.wrapper}>

      {/* Imágenes en cuadrícula */}
      {listaImagenes.length > 0 && (
        <div className={styles.imgGrid}>
          {listaImagenes.map((src, idx) => (
            <div key={idx} className={styles.imgGridItem}>
              <img src={src} alt={`${nombre} ${idx + 1}`} className={styles.imgGridImg} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.topRow}>
        <span
          className={`${styles.badge} ${estado === "ACTIVO" ? styles.activo : styles.inactivo}`}
        >
          {estado}
        </span>

        {stockBajo && (
          <span className={styles.alertBadge}>
            <FiAlertTriangle />
            Stock bajo
          </span>
        )}

        <span className={styles.identifier}>{nombre}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Nombre del producto" value={nombre} full />
        <Field label="Descripción" value={descripcion} full />
        <Field label="Categoría" value={categoria_nombre} />
        <Field label="Precio" value={`$${Number(precio).toLocaleString()}`} />
        <Field
          label="Stock"
          value={`${formatCantidad(stock_producto)} uds.`}
          highlight={stockBajo}
        />
        <Field label="Estado" value={estado} />
      </div>

      {/* Receta */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          <FiList />
          Receta — Insumos requeridos por unidad
        </p>

        {receta.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "#6b7280", fontStyle: "italic" }}>
            Sin receta registrada.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Insumo</th>
                  <th>Cantidad requerida</th>
                </tr>
              </thead>
              <tbody>
                {receta.map((r, i) => (
                  <tr key={r.insumo_id}>
                    <td>{i + 1}</td>
                    <td>{r.nombre_insumo}</td>
                    <td>
                      {formatCantidad(r.cantidad_requerida)} {r.unidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
