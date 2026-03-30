import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://todo-app-91pe.onrender.com/api",
  timeout: 15000, // ✅ increase timeout — Render free tier cold starts
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // ✅ must be false for cross-origin on mobile
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
