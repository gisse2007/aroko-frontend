import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiUpload, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useOrders } from "../../hooks/useOrders";
import { useAuthContext } from "../../context/AuthContext";
import { resolveImageUrl } from "../../utils/image";
import styles from "./CheckoutModal.module.css";

const QRS = [
  {
    banco: "Bancolombia",
    tipo: "Ahorros",
    qr: "/qr/bancolombia.png",
    color: "#FFCD00",
    colorText: "#7a6000",
    bg: "rgba(255,205,0,0.10)",
    border: "rgba(255,205,0,0.35)",
  },
  {
    banco: "Nequi",
    tipo: "Nequi",
    qr: "/qr/nequi.png",
    color: "#7C3AED",
    colorText: "#5b21b6",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.25)",
  },
  {
    banco: "Daviplata",
    tipo: "Daviplata",
    qr: "/qr/daviplata.png",
    color: "#DC2626",
    colorText: "#991b1b",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.25)",
  },
];

const EMPTY_FORM = { nombre: "", email: "", telefono: "", direccion: "", fecha_entrega: "" };

export default function CheckoutModal({ open, onClose, items, total, onSuccess }) {
  const navigate             = useNavigate();
  const { loading, createOrder } = useOrders();
  const { user }             = useAuthContext();

  const [form,        setForm]        = useState(EMPTY_FORM);
  const [paymentType, setPaymentType] = useState("COMPLETO");
  const [paidAmount,  setPaidAmount]  = useState("");
  const [file,        setFile]        = useState(null);
  const [errors,      setErrors]      = useState({});
  const [apiErr,      setApiErr]      = useState("");

  // Cada vez que se abre el modal, pre-rellenar con los datos del contexto
  useEffect(() => {
    if (!open || !user) return;
    const timer = setTimeout(() => {
      setForm({
        nombre:    user.nombre_usuario || "",
        email:     user.correo        || "",
        telefono:  user.telefono      || "",
        direccion: user.direccion     || "",
        fecha_entrega: "",
      });
      setErrors({});
      setApiErr("");
    }, 0);
    return () => clearTimeout(timer);
  }, [open, user]);

  if (!open) return null;
  if (!user) return null;

  const safeTotal = Number(total) || 0;

  // Monto efectivo a pagar según tipo
  const effectivePaid = paymentType === "COMPLETO"
    ? safeTotal
    : Number(paidAmount) || 0;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())    e.nombre    = "El nombre es obligatorio.";
    if (!form.email.trim())     e.email     = "El correo es obligatorio.";
    if (!form.telefono.trim())  e.telefono  = "El teléfono es obligatorio.";
    if (!form.direccion.trim()) e.direccion = "La dirección es obligatoria.";
    if (!file)                  e.file      = "Adjunta el comprobante de pago.";

    if (paymentType === "ABONO") {
      const n = Number(paidAmount);
      if (!paidAmount || isNaN(n) || n <= 0)
        e.paidAmount = "Ingresa el monto del abono.";
      else if (n >= safeTotal)
        e.paidAmount = `El abono debe ser menor al total ($${safeTotal.toLocaleString("es-CO")}).`;
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErr("");

    if (items.length === 0 || safeTotal === 0) {
      setApiErr("El carrito está vacío o el total es 0.");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      await createOrder(items, file, {
        ...form,
        payment_type:  paymentType,
        paid_amount:   effectivePaid,
        total:         safeTotal,
        fecha_entrega: form.fecha_entrega || null,
      });
      // Limpiar estado local antes de navegar
      setForm(EMPTY_FORM);
      setPaymentType("COMPLETO");
      setPaidAmount("");
      setFile(null);
      onSuccess();
      navigate("/mis-pedidos");
    } catch (err) {
      setApiErr(err.message);
    }
  };

  const setField = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(ev) => ev.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Confirmar pedido</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><FiX /></button>
        </div>

        <div className={styles.body}>

          {/* Resumen */}
          <div className={styles.summary}>
            <p className={styles.sectionLabel}>Resumen del pedido</p>
            <ul className={styles.itemList}>
              {items.map((item) => (
                <li key={item.id} className={styles.itemRow}>
                  <img
                    src={resolveImageUrl(item.imagen ?? item.img ?? null) || "https://placehold.co/48x48?text="}
                    alt={item.name}
                    className={styles.itemImg}
                    loading="lazy"
                    decoding="async"
                    width="40"
                    height="40"
                  />
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>× {item.qty}</span>
                  <span className={styles.itemSubtotal}>
                    ${((Number(item.price) || 0) * item.qty).toLocaleString("es-CO")}
                  </span>
                </li>
              ))}
            </ul>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong>${safeTotal.toLocaleString("es-CO")}</strong>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <p className={styles.sectionLabel}>Tus datos</p>

            <div className={styles.grid}>
              {/* Nombre */}
              <div className={styles.field}>
                <label>Nombre completo</label>
                <input value={form.nombre} onChange={setField("nombre")}
                  placeholder="Nombre completo" className={errors.nombre ? styles.inputErr : ""} />
                {errors.nombre && <span className={styles.errMsg}>{errors.nombre}</span>}
              </div>

              {/* Email */}
              <div className={styles.field}>
                <label>Correo electrónico</label>
                <input type="email" value={form.email} onChange={setField("email")}
                  placeholder="correo@ejemplo.com" className={errors.email ? styles.inputErr : ""} />
                {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
              </div>

              {/* Teléfono */}
              <div className={styles.field}>
                <label>Teléfono</label>
                <input value={form.telefono} onChange={setField("telefono")}
                  placeholder="+57 300 000 0000" className={errors.telefono ? styles.inputErr : ""} />
                {errors.telefono && <span className={styles.errMsg}>{errors.telefono}</span>}
              </div>

              {/* Dirección */}
              <div className={styles.field}>
                <label>Dirección de entrega</label>
                <input value={form.direccion} onChange={setField("direccion")}
                  placeholder="Calle, carrera, barrio…" className={errors.direccion ? styles.inputErr : ""} />
                {errors.direccion && <span className={styles.errMsg}>{errors.direccion}</span>}
              </div>

              {/* Fecha de entrega (opcional) */}
              <div className={styles.field}>
                <label>Fecha de entrega <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional)</span></label>
                <input
                  type="date"
                  value={form.fecha_entrega}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={setField("fecha_entrega")}
                />
              </div>
            </div>

            {/* Tipo de pago */}
            <div className={styles.field}>
              <label>Tipo de pago</label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioOption} ${paymentType === "COMPLETO" ? styles.radioSelected : ""}`}>
                  <input
                    type="radio"
                    name="payment_type"
                    value="COMPLETO"
                    checked={paymentType === "COMPLETO"}
                    onChange={() => { setPaymentType("COMPLETO"); setPaidAmount(""); setErrors((er) => ({ ...er, paidAmount: "" })); }}
                  />
                  Pago completo
                  <span className={styles.radioAmount}>${safeTotal.toLocaleString("es-CO")}</span>
                </label>

                <label className={`${styles.radioOption} ${paymentType === "ABONO" ? styles.radioSelected : ""}`}>
                  <input
                    type="radio"
                    name="payment_type"
                    value="ABONO"
                    checked={paymentType === "ABONO"}
                    onChange={() => { setPaymentType("ABONO"); setErrors((er) => ({ ...er, paidAmount: "" })); }}
                  />
                  Abono parcial
                </label>
              </div>
            </div>

            {/* Monto del abono — solo si ABONO */}
            {paymentType === "ABONO" && (
              <div className={styles.field}>
                <label>Monto del abono</label>
                <input
                  type="number"
                  min="1"
                  max={safeTotal - 1}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => { setPaidAmount(e.target.value); setErrors((er) => ({ ...er, paidAmount: "" })); }}
                  placeholder={`Máx. $${(safeTotal - 1).toLocaleString("es-CO")}`}
                  className={errors.paidAmount ? styles.inputErr : ""}
                />
                {errors.paidAmount && <span className={styles.errMsg}>{errors.paidAmount}</span>}
              </div>
            )}

            {/* QR Pagos */}
            <div className={styles.qrBox}>
              <p className={styles.qrTitle}>Escanea el QR para pagar</p>
              <div className={styles.qrGrid}>
                {QRS.map((q) => (
                  <div
                    key={q.banco}
                    className={styles.qrCard}
                    style={{ background: q.bg, borderColor: q.border }}
                  >
                      <div className={styles.qrImgWrap}>
                        <img
                          src={q.qr}
                          alt={`QR ${q.banco}`}
                          className={styles.qrImg}
                          loading="lazy"
                          decoding="async"
                          width="120"
                          height="120"
                        />
                      </div>
                    <span className={styles.qrBanco} style={{ color: q.colorText }}>
                      {q.banco}
                    </span>
                    <span className={styles.qrTipo}>{q.tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comprobante */}
            <div className={styles.field}>
              <label>Comprobante de pago</label>
              <label className={`${styles.fileLabel} ${file ? styles.fileLabelDone : ""} ${errors.file ? styles.fileLabelErr : ""}`}>
                {file
                  ? <><FiCheckCircle /> {file.name}</>
                  : <><FiUpload /> Seleccionar archivo (imagen o PDF)</>}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className={styles.fileInput}
                  onChange={(e) => { setFile(e.target.files[0] || null); setErrors((er) => ({ ...er, file: "" })); }}
                />
              </label>
              {errors.file && <span className={styles.errMsg}>{errors.file}</span>}
            </div>

            {apiErr && (
              <p className={styles.apiErr}>
                <FiAlertTriangle /> {apiErr}
              </p>
            )}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || items.length === 0 || safeTotal === 0}
              >
                {loading ? "Procesando…" : `Confirmar — $${effectivePaid.toLocaleString("es-CO")}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
