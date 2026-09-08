import { useState, useRef, useCallback } from "react";
import styles from "./Tooltip.module.css";

/**
 * Tooltip reutilizable para botones de acción (CRUDs).
 * Usa position:fixed calculado con getBoundingClientRect,
 * por lo que nunca es recortado por contenedores con overflow
 * (tablas con scroll horizontal, modales, etc.).
 *
 * @param {string}   label     Texto del tooltip
 * @param {ReactNode} children  Elemento al que se le aplica (normalmente un <button>)
 * @param {"top"|"bottom"} placement Posición del tooltip
 */
export default function Tooltip({ label, children, placement = "top" }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords]   = useState(null);
  const anchorRef             = useRef(null);

  const show = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({
      x: r.left + r.width / 2,
      y: placement === "top" ? r.top : r.bottom,
    });
    setVisible(true);
  }, [placement]);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <>
      <span
        ref={anchorRef}
        className={styles.anchor}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>

      {visible && coords && (
        <span
          role="tooltip"
          className={`${styles.tooltip} ${placement === "top" ? styles.top : styles.bottom}`}
          style={{ left: coords.x, top: coords.y }}
        >
          {label}
        </span>
      )}
    </>
  );
}