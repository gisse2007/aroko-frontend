import { useEffect, memo } from "react";
import { FiX } from "react-icons/fi";
import styles from "./Modal.module.css";

export default memo(function Modal({ title, open, onClose, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = `modal-title-${title?.toLowerCase().replace(/\s+/g, "-") ?? "dialog"}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-size={size}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h3 className={styles.title} id={titleId}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar diálogo">
            <FiX />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
});
