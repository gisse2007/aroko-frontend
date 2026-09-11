import { FiImage } from "react-icons/fi";
import styles from "../Detalle.module.css";
import { resolveImageUrl } from "../../utils/image";
import { formatCantidad } from "../../utils/number";

const ESTADO_CLS = { ACTIVA: styles.activa, ANULADA: styles.anulada };

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export default function CompraDetalle({ compra }) {
  if (!compra) return null;
  const items = Array.isArray(compra.detalle_compra)
    ? compra.detalle_compra
    : Array.isArray(compra.detalle)
      ? compra.detalle
      : [];

  const {
    proveedor_nombre, empleado_nombre, fecha_compra,
    numero_factura, estado, iva,
    foto_factura, subtotal_base, iva_valor, total_compra,
  } = compra;

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>{estado}</span>
        <span className={styles.identifier}>{numero_factura}</span>
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Proveedor"           value={proveedor_nombre} full />
        <Field label="N° Factura"          value={numero_factura} />
        <Field label="Fecha de compra"     value={fecha_compra?.split("T")[0] ?? fecha_compra} />
        <Field label="IVA"                 value={`${iva}%`} />
        <Field label="Empleado responsable" value={empleado_nombre} />
        <Field label="Estado"              value={estado} />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Detalle de insumos</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Unidades</th>
                <th>Cantidad por unidad</th>
                <th>Unidad de medida</th>
                <th>Stock ingresado</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => {
                const stockIngresado = d.stock_ingresado != null
                  ? Number(d.stock_ingresado)
                  : Number(d.cantidad) * Number(d.cantidad_por_unidad || 0);

                return (
                  <tr key={d.insumo_id ?? `${d.nombre_insumo}-${d.cantidad}`}>
                    <td>{d.nombre_insumo}</td>
                    <td>{formatCantidad(d.cantidad)}</td>
                    <td>{d.cantidad_por_unidad == null ? "—" : formatCantidad(d.cantidad_por_unidad)}</td>
                    <td>{d.unidad_medida}</td>
                    <td>{stockIngresado ? `${formatCantidad(stockIngresado)} ${d.unidad_medida}` : "—"}</td>
                    <td>${Number(d.precio).toLocaleString()}</td>
                    <td>${Number(d.subtotal).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.totalesRow}>
          <span>Subtotal: <b>${Number(subtotal_base).toLocaleString()}</b></span>
          <span>IVA ({iva}%): <b>${Number(iva_valor).toLocaleString()}</b></span>
          <span className={styles.totalFinal}>Total: <b>${Number(total_compra).toLocaleString()}</b></span>
        </div>
      </div>

      {foto_factura && (
        <div className={styles.fotoSection}>
          <p className={styles.sectionTitle}><FiImage /> Comprobante adjunto</p>
          {/\.(jpg|jpeg|png)$/i.test(foto_factura) ? (
            <img src={resolveImageUrl(foto_factura)} alt="Factura" className={styles.fotoImg} />
          ) : (
            <a href={resolveImageUrl(foto_factura)} target="_blank" rel="noreferrer" className={styles.pdfLink}>
              Ver PDF adjunto
            </a>
          )}
        </div>
      )}

    </div>
  );
}
