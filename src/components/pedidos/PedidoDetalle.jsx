import { FiShoppingBag, FiExternalLink, FiImage } from "react-icons/fi";
import { ESTADOS_LABEL } from "../../hooks/usePedidos";
import api from "../../api/axios";
import styles from "../Detalle.module.css";

// Deriva el origen del servidor desde la baseURL de axios (quita /api)
const SERVER_ORIGIN = api.defaults.baseURL?.replace(/\/api\/?$/, "") ?? "http://localhost:3000";

const ESTADO_CLS = {
  ACTIVO: styles.activo, EN_ESPERA_FECHA: styles.espera, CON_FECHA_ASIGNADA: styles.conFecha,
  ACEPTADO: styles.aceptado, RECHAZADO: styles.rechazado, ENTREGADO: styles.entregado, INACTIVO: styles.inactivo,
};

const PAYMENT_LABEL = { COMPLETO: "Pago completo", ABONO: "Abono parcial" };

const Field = ({ label, value, full, highlight }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""} ${highlight ? styles.highlight : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export default function PedidoDetalle({ pedido }) {
  if (!pedido) return <p className={styles.notFound}>Pedido no encontrado.</p>;

  const {
    numero_pedido, cliente_nombre, cliente_telefono,
    empleado_nombre, fecha_pedido, fecha_entrega,
    estado, observaciones, created_by, detalle = [], total,
    payment_proof, payment_type, paid_amount, pending_amount,
    valor_pagado,
  } = pedido;

  const isCatalogo = String(numero_pedido).startsWith("ORD-");
  const proofUrl = payment_proof
    ? (payment_proof.startsWith("http") ? payment_proof : `${SERVER_ORIGIN}${payment_proof}`)
    : null;
  const isImage = proofUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(proofUrl);

  /* ── Información de pago unificada (catálogo y dashboard) ── */
  const abonado = paid_amount ?? valor_pagado ?? null;
  const tipoPago = payment_type
    ?? (abonado != null
      ? (Number(abonado) >= Number(total) ? "COMPLETO" : "ABONO")
      : null);
  const saldoPendiente = pending_amount ?? Math.max(0, Number(total) - Number(abonado ?? 0));

  return (
    <div className={styles.wrapper}>

      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>
          {ESTADOS_LABEL[estado] ?? estado}
        </span>
        <span className={styles.identifier}>{numero_pedido}</span>
        {isCatalogo && (
          <span className={styles.alertBadge}>🛒 Catálogo online</span>
        )}
      </div>

      <div className={styles.fieldsGrid}>
        <Field label="Cliente"          value={cliente_nombre}   full />
        <Field label="Teléfono"         value={cliente_telefono} />
        <Field label="Empleado"         value={empleado_nombre} />
        <Field label="Fecha del pedido" value={fecha_pedido?.split("T")[0] ?? fecha_pedido} />
        <Field label="Fecha de entrega" value={fecha_entrega?.split("T")[0] ?? fecha_entrega} />
        <Field label="Registrado por"   value={created_by} />
      </div>

      {/* ── Información de pago (catálogo y dashboard) ── */}
      {tipoPago && (
        <div className={styles.fieldsGrid}>
          <Field label="Tipo de pago" value={PAYMENT_LABEL[tipoPago] ?? tipoPago} />
          <Field label="Total"        value={`$${Number(total).toLocaleString("es-CO")}`} />
          {tipoPago === "ABONO" && (
            <>
              <Field label="Abonado" value={`$${Number(abonado).toLocaleString("es-CO")}`} />
              <Field
                label="Saldo pendiente"
                value={`$${Number(saldoPendiente).toLocaleString("es-CO")}`}
                highlight={Number(saldoPendiente) > 0}
              />
            </>
          )}
        </div>
      )}

      {/* ── Comprobante de pago ── */}
      {proofUrl && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}><FiImage /> Comprobante de pago</p>
          {isImage ? (
            <div className={styles.fotoSection}>
              <img src={proofUrl} alt="Comprobante" className={styles.fotoImg} />
              <a href={proofUrl} target="_blank" rel="noreferrer" className={styles.pdfLink}>
                <FiExternalLink /> Abrir en pantalla completa
              </a>
            </div>
          ) : (
            <a href={proofUrl} target="_blank" rel="noreferrer" className={styles.pdfLink}>
              <FiExternalLink /> Ver comprobante (PDF)
            </a>
          )}
        </div>
      )}

      {observaciones && (
        <div className={styles.obsBlock}>
          <p className={styles.blockLabel}>Observaciones</p>
          <p className={styles.blockValue}>{observaciones}</p>
        </div>
      )}

      <div className={styles.section}>
        <p className={styles.sectionTitle}><FiShoppingBag /> Productos del pedido</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {detalle.map((d, i) => (
                <tr key={d.producto_id ?? i}>
                  <td>{d.nombre}</td>
                  <td>{d.cantidad}</td>
                  <td>${Number(d.precio).toLocaleString("es-CO")}</td>
                  <td>${Number(d.subtotal).toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.totalesRow}>
          <span className={styles.totalFinal}>
            Total: <b>${Number(total).toLocaleString("es-CO")}</b>
          </span>
        </div>
      </div>

    </div>
  );
}
