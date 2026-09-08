/**
 * Componentes de Loading reutilizables
 *
 * Exporta:
 *   - Spinner        → icono animado standalone
 *   - TableLoading   → reemplaza la tabla mientras carga
 *   - BtnLoading     → botón con estado de carga integrado
 *   - LoadingOverlay → overlay semitransparente global
 */

import { FiLoader } from "react-icons/fi";
import styles from "./Loading.module.css";

/* ── Spinner base ── */
export function Spinner({ size = 20, color = "currentColor" }) {
  return (
    <FiLoader
      className={styles.spinnerIcon}
      style={{ width: size, height: size, color }}
      aria-hidden="true"
    />
  );
}

/* ── TableLoading ── */
export function TableLoading({ message = "Cargando información..." }) {
  return (
    <div className={styles.tableLoading} role="status" aria-live="polite">
      <Spinner size={28} color="var(--accent)" />
      <span className={styles.tableLoadingText}>{message}</span>
    </div>
  );
}

/* ── BtnLoading ── */
export function BtnLoading({
  loading = false,
  loadingText = "Procesando...",
  children,
  className = "",
  disabled,
  ...rest
}) {
  return (
    <button
      {...rest}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <span className={styles.btnInner}>
          <Spinner size={14} />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* ── LoadingOverlay ── */
export function LoadingOverlay({ visible = false, text = "Procesando..." }) {
  if (!visible) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={text}>
      <div className={styles.overlayCard}>
        <Spinner size={40} color="var(--accent)" />
        <p className={styles.overlayText}>{text}</p>
        <p className={styles.overlaySubtext}>Por favor espere.</p>
      </div>
    </div>
  );
}
