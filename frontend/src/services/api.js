import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ||
  "https://todo-app-91pe.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }

    // ✅ Clean offline error message
    if (!error.response && (
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("offline")
    )) {
      error.message = "You're offline — please reconnect to add or update tasks";
    }

    return Promise.reject(error);
  }
);

export default api;