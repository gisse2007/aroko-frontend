import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, ""),
  timeout: 20000,
});

// Referencia mutable al contexto de loading (se inyecta desde App.jsx).
let _incrementHttp = null;
let _decrementHttp = null;

export function setLoadingHandlers(inc, dec) {
  _incrementHttp = inc;
  _decrementHttp = dec;
}

// Interceptor de petición: Content-Type + JWT + contador de loading
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  _incrementHttp?.();
  return config;
});

// Endpoints públicos de auth: un 401 aquí es una credencial inválida,
// no una sesión invalidada — nunca deben disparar el logout automático.
const PUBLIC_AUTH_RE = /\/auth\/(login|register|recuperar|reset-password)(\?|$)/;

// Interceptor de respuesta: decrementa el contador siempre (éxito o error).
// Además, si cualquier endpoint protegido responde 401 (token expirado o
// invalidado por un cambio de contraseña — ver token_version en el backend),
// cierra la sesión localmente de inmediato y redirige a /login, sin esperar
// a que el usuario interactúe.
api.interceptors.response.use(
  (response) => { _decrementHttp?.(); return response; },
  (error) => {
    _decrementHttp?.();

    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (status === 401 && !PUBLIC_AUTH_RE.test(url) && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      try { sessionStorage.removeItem("aroko.authme"); } catch { /* noop */ }
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
