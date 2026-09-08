import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api"
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

// Interceptor de respuesta: decrementa el contador siempre (éxito o error)
api.interceptors.response.use(
  (response) => { _decrementHttp?.(); return response; },
  (error) => {
    _decrementHttp?.();
    return Promise.reject(error);
  },
);

export default api;
