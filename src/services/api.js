import apiAxios from "../api/axios";

/**
 * Cliente de conveniencia que delega en la instancia central de Axios (src/api/axios.js).
 */
export const api = {
  get: (endpoint, config) => apiAxios.get(endpoint, config).then((r) => r.data),
  post: (endpoint, body, config) => apiAxios.post(endpoint, body, config).then((r) => r.data),
  put: (endpoint, body, config) => apiAxios.put(endpoint, body, config).then((r) => r.data),
  delete: (endpoint, config) => apiAxios.delete(endpoint, config).then((r) => r.data),
};

export default api;
