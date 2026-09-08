import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./AnularModal.module.css";

export default function AnularModal({
  open,
  produccion,
  title = "¿Estás seguro de anular este registro?",
  subtitle,
  confirmLabel = "Sí, anular",
  onConfirm,
  onCancel,
}) {
  const [motivo, setMotivo] = useState("");
  const [error,  setError]  = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (!motivo.trim() || motivo.trim().length < 10) {
      setError("El motivo de anulación debe tener al menos 10 caracteres.");
      return;
    }
    onConfirm(motivo.trim());
    setMotivo("");
    setError("");
  };

  const handleCancel = () => {
    setMotivo("");
    setError("");
    onCancel();
  };

  const summary = subtitle ?? (
    produccion
      ? (
          produccion.detalle?.length != null
            ? `${produccion.detalle.length} ${produccion.detalle.length === 1 ? "elemento" : "elementos"} — ${produccion.fecha?.split("T")[0] ?? produccion.fecha}`
            : produccion.fecha?.split("T")[0] ?? produccion.fecha
        )
      : ""
  );

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <FiAlertTriangle />
        </div>
        <h3 className={styles.title}>{title}</h3>
        {summary && <p className={styles.subtitle}>{summary}</p>}
        <div className={styles.field}>
          <label className={styles.label}>Motivo de anulación *</label>
          <textarea
            className={`${styles.textarea} ${error ? styles.textareaError : ""}`}
            rows={3}
            placeholder="Describe el motivo de la anulación (mín. 10 caracteres)…"
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setError(""); }}
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleCancel}>No, cancelar</button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
