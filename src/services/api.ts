import axios from "axios";

/**
 * IMPORTANT:
 * VITE_API_URL should be:
 * https://api.letslearnandlead.com (production)
 * http://localhost:5000 (development)
 * 
 * The /api prefix is added automatically below
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Debug: Log the API base URL in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    baseURL: `${API_BASE_URL}/api`,
    mode: import.meta.env.MODE
  });
}

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // ✅ REQUIRED for cookies
  // NOTE: Don't set Content-Type here! 
  // Axios automatically sets it based on request data:
  // - FormData → multipart/form-data (for file uploads)
  // - Objects → application/json (for regular API calls)
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
  create: (data: any) => api.post("/courses", data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

/* ================= NOTES ================= */
export const noteAPI = {
  getAll: (params?: any) => api.get("/notes", { params }),
  getById: (id: string) => api.get(`/notes/${id}`),
  getByCourse: (courseId: string) => api.get(`/notes/course/${courseId}`),
  create: (data: any) => api.post("/notes", data),
  update: (id: string, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

/* ================= SHOP ================= */
export const shopAPI = {
  products: {
    getAll: (params?: any) => api.get("/shop/products", { params }),
    getById: (id: string) => api.get(`/shop/products/${id}`),
  },
  orders: {
    getAll: () => api.get("/shop/orders"),
    create: (data: any) => api.post("/shop/orders", data),
  },
  payment: {
    createOrder: (data: any) => api.post("/shop/payment/create-order", data),
    verifyPayment: (data: any) => api.post("/shop/payment/verify", data),
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

/* ================= NOTIFICATIONS ================= */
export const notificationAPI = {
  getAll: (params?: any) => api.get("/notifications", { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  create: (data: any) => api.post("/notifications", data),
  update: (id: string, data: any) => api.put(`/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

/* ================= PAYMENT ================= */
export const paymentAPI = {
  createOrder: (data: any) => api.post("/payment/create-order", data),
  verifyPayment: (data: any) => api.post("/payment/verify", data),
  checkEnrollment: (courseId: string) => api.get(`/payment/check-enrollment/${courseId}`),
  freeEnroll: (courseId: string) => api.post("/payment/free-enroll", { courseId }),
};

/* ================= ADMIN ================= */
export const adminAPI = {
  users: {
    getAll: (params?: any) => api.get("/admin/users", { params }),
    getById: (id: string) => api.get(`/admin/users/${id}`),
    update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
    delete: (id: string) => api.delete(`/admin/users/${id}`),
  },
  students: {
    getAll: (params?: any) => api.get("/admin/students", { params }),
    getById: (id: string) => api.get(`/admin/students/${id}`),
    update: (id: string, data: any) => api.put(`/admin/students/${id}`, data),
    delete: (id: string) => api.delete(`/admin/students/${id}`),
  },
  orders: {
    getAll: (params?: any) => api.get("/admin/orders", { params }),
    getById: (id: string) => api.get(`/admin/orders/${id}`),
    update: (id: string, data: any) => api.put(`/admin/orders/${id}`, data),
    updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  },
  products: {
    create: (data: any) => api.post("/admin/products", data),
    update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
    delete: (id: string) => api.delete(`/admin/products/${id}`),
  },
  dashboard: {
    getStats: () => api.get("/admin/dashboard/stats"),
  },
  analytics: {
    overview: () => api.get("/admin/analytics/overview"),
  },
  enrollStudent: (studentEmail: string, courseId: string) =>
    api.post("/admin/enroll-student", { studentEmail, courseId }),
};

export default api;
