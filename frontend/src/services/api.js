import axios from "axios";
import { API_URL } from "../config/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Silently clear token and reload — no toast, no console error spam
      localStorage.removeItem("token");
      // Only reload if we actually had a token (i.e., session expired, not just unauthenticated)
      if (error.config?.headers?.Authorization) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
