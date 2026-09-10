/**
 * Resuelve la URL pública de una imagen.
 * - Si ya es URL absoluta (http/https) la devuelve tal cual.
 * - Si es ruta relativa (/uploads/...) la prefija con el origen del backend.
 * - Si es null/undefined devuelve null.
 */
export function resolveImageUrl(img) {
  if (!img) return null;
  if (typeof img !== "string") return null;
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : "http://localhost:3000";
  if (/^https?:\/\//i.test(img)) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\//i.test(img)
      ? `${apiOrigin}${new URL(img).pathname}${new URL(img).search}`
      : img;
  }
  const base = apiOrigin;
  return `${base}${img.startsWith("/") ? img : `/${img}`}`;
}

export function normalizeProduct(raw = {}) {
  if (!raw || typeof raw !== "object") return raw;
  // El backend siempre devuelve el campo como `imagen`
  const imagen = resolveImageUrl(raw.imagen ?? null);
  return { ...raw, imagen: imagen ?? null, img: imagen ?? null };
}

export default { resolveImageUrl, normalizeProduct };
