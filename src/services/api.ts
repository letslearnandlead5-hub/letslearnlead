import axios from "axios";

/**
 * IMPORTANT:
 * VITE_API_URL must be:
 * https://api.letslearnandlead.com
 * (NO /api here)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // ✅ REQUIRED for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Request interceptor (JWT from Zustand)
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Auth parse error:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ❗ Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

/* ================= AUTH ================= */
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

/* ================= COURSES ================= */
export const courseAPI = {
  getAll: (params?: any) => api.get("/courses", { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  enroll: (id: string) => api.post(`/courses/${id}/enroll`),
  getEnrolled: () => api.get("/courses/enrolled/my-courses"),
};

/* ================= NOTES ================= */
export const noteAPI = {
  getAll: (params?: any) => api.get("/notes", { params }),
  getById: (id: string) => api.get(`/notes/${id}`),
};

/* ================= SHOP ================= */
export const shopAPI = {
  products: {
    getAll: () => api.get("/shop/products"),
    getById: (id: string) => api.get(`/shop/products/${id}`),
  },
};

/* ================= SETTINGS ================= */
export const settingsAPI = {
  get: () => api.get("/settings"),
  update: (data: any) => api.put("/settings", data),
};

/* ================= STATS ================= */
export const statsAPI = {
  getPublicStats: () => api.get("/stats/public"),
};

export default api;
