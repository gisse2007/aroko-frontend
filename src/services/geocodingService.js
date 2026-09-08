/**
 * Servicio de geocodificación usando Nominatim (OpenStreetMap).
 * Gratuito, sin API key.
 * IMPORTANTE: desde el navegador NO se puede enviar el header User-Agent
 * (los navegadores lo bloquean por seguridad). Se omite intencionalmente.
 */

const BASE = "https://nominatim.openstreetmap.org";

export async function searchAddress(query, countryCode = "co") {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q:              query.trim(),
    format:         "json",
    addressdetails: "1",
    limit:          "7",
    countrycodes:   countryCode,
    "accept-language": "es",
  });

  const res = await fetch(`${BASE}/search?${params}`);
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat:            String(lat),
    lon:            String(lon),
    format:         "json",
    addressdetails: "1",
    zoom:           "18",
    "accept-language": "es",
  });

  const res = await fetch(`${BASE}/reverse?${params}`);
  if (!res.ok) throw new Error(`Nominatim reverse error: ${res.status}`);
  return res.json();
}

export function normalizeNominatim(result) {
  if (!result) return null;
  const a = result.address ?? {};
  return {
    direccion_completa: result.display_name ?? "",
    calle:         a.road ?? a.pedestrian ?? a.footway ?? a.path ?? "",
    numero:        a.house_number ?? "",
    barrio:        a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village ?? a.hamlet ?? "",
    ciudad:        a.city ?? a.town ?? a.municipality ?? a.county ?? a.state_district ?? "",
    estado_geo:    a.state ?? a.region ?? "",
    pais:          a.country ?? "",
    codigo_postal: a.postcode ?? "",
    latitud:       parseFloat(result.lat) || 0,
    longitud:      parseFloat(result.lon) || 0,
  };
}
