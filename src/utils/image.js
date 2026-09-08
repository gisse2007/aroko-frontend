/**
 * Resuelve la URL pública de una imagen.
 * - Si ya es URL absoluta (http/https) la devuelve tal cual.
 * - Si es ruta relativa (/uploads/...) la prefija con el origen del backend.
 * - Si es null/undefined devuelve null.
 */
export function resolveImageUrl(img) {
  if (!img) return null;
  if (typeof img !== "string") return null;
  if (/^https?:\/\//i.test(img)) return img;
  const base = (import.meta?.env?.VITE_API_URL && new URL(import.meta.env.VITE_API_URL).origin) || "http://localhost:3000";
  return `${base}${img.startsWith("/") ? img : `/${img}`}`;
}

export function normalizeProduct(raw = {}) {
  if (!raw || typeof raw !== "object") return raw;
  // El backend siempre devuelve el campo como `imagen`
  const imagen = resolveImageUrl(raw.imagen ?? null);
  return { ...raw, imagen: imagen ?? null, img: imagen ?? null };
}

export default { resolveImageUrl, normalizeProduct };
