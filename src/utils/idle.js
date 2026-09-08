/**
 * Ejecuta `fn` cuando el hilo principal está libre (después del primer
 * render / LCP). Evita que las peticiones de datos compitan con la
 * hidratación y el pintado del Hero durante la carga inicial.
 *
 * @param {() => void} fn
 * @param {number} [timeout=1500] Tiempo máximo de espera en ms.
 * @returns {number|null} Handle para cancelar con `cancelIdle`.
 */
export function whenIdle(fn, timeout = 1500) {
  if (typeof window === "undefined") {
    fn();
    return null;
  }
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(fn, { timeout });
  }
  // Fallback: Safari y navegadores antiguos
  return window.setTimeout(fn, Math.min(timeout, 300));
}

/**
 * Cancela un trabajo programado con `whenIdle`.
 * @param {number|null} handle
 */
export function cancelIdle(handle) {
  if (handle == null || typeof window === "undefined") return;
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}