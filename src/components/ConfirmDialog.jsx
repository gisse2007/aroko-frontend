import { FiAlertTriangle } from "react-icons/fi";
import { memo } from "react";
import styles from "./ConfirmDialog.module.css";

export default memo(function ConfirmDialog({
  open,
  message,
  confirmLabel = "Confirmar",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.iconWrap} ${styles[variant]}`}>
          <FiAlertTriangle />
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>No</button>
          <button className={`${styles.confirmBtn} ${styles[variant]}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
