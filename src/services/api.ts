import axios, { AxiosRequestConfig } from "axios";
import { getDeviceId } from "../utils/deviceId";

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
  withCredentials: true, // ✅ REQUIRED — sends HTTP-only refresh token cookie
  timeout: 30000,
});

// ── Flag to prevent multiple simultaneous refresh attempts ──────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach JWT access token from Zustand store
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

    // Attach device ID on every request for device verification
    try {
      const deviceId = getDeviceId();
      if (deviceId) {
        config.headers['X-Device-Id'] = deviceId;
      }
    } catch {
      // localStorage may be unavailable in some edge cases
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;
    const status = error.response?.status;
    const responseData = error.response?.data;
    const errorCode = responseData?.code;

    // ── 401 handling ─────────────────────────────────────────────────────────
    if (status === 401) {

      // DEVICE_MISMATCH or SESSION_INVALIDATED → trigger session expiry UI
      if (
        errorCode === 'DEVICE_MISMATCH' ||
        errorCode === 'SESSION_INVALIDATED' ||
        errorCode === 'ACCOUNT_BLOCKED'
      ) {
        // Don't show the modal if the user is already on an auth page
        const authPaths = ['/login', '/login/', '/signup', '/signup/', '/auth/forgot-password/', '/auth/reset-password/'];
        const isOnAuthPage = authPaths.some(p => window.location.pathname === p);
        if (isOnAuthPage) {
          return Promise.reject(responseData || error.message);
        }

        const reason =
          errorCode === 'DEVICE_MISMATCH'
            ? 'Your session was ended because this account logged in on another device.'
            : errorCode === 'ACCOUNT_BLOCKED'
            ? 'Your account has been disabled by an administrator.'
            : 'Your session has been ended. Please log in again.';

        // Dynamically import to avoid circular dependency
        const { useAuthStore } = await import('../store/useAuthStore');
        useAuthStore.getState().triggerSessionExpiry(reason);
        return Promise.reject(responseData || error.message);
      }

      // TOKEN_EXPIRED → attempt silent refresh (only once per original request)
      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Queue the request until refresh completes
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`,
              };
              resolve(api(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const refreshResponse: any = await api.post('/auth/refresh');
          const newToken = refreshResponse?.token;

          if (newToken) {
            // Update the store token
            const { useAuthStore } = await import('../store/useAuthStore');
            useAuthStore.getState().setToken(newToken);
            if (refreshResponse.user) {
              useAuthStore.getState().updateUser(refreshResponse.user);
            }

            onTokenRefreshed(newToken);
            isRefreshing = false;

            // Retry original request with new token
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return api(originalRequest);
          }
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Refresh failed → full logout
          const { useAuthStore } = await import('../store/useAuthStore');
          useAuthStore.getState().triggerSessionExpiry('Your session has expired. Please log in again.');
          return Promise.reject(refreshError);
        }
      }

      // Generic 401 (e.g., no token on a protected endpoint) — clear state
      if (!originalRequest._retry) {
        localStorage.removeItem("auth-storage");
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(responseData || error.message);
  }
);

/* ================= AUTH ================= */
export const authAPI = {
  signup: (data: { name: string; email: string; password: string; deviceId?: string; deviceInfo?: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string; deviceId?: string; deviceInfo?: string; forceLogout?: boolean }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  getMe: () => api.get("/auth/me"),
  adminInvalidateSession: (userId: string) =>
    api.post("/auth/admin/invalidate-session", { userId }),
};

/* ================= COURSES ================= */
export const courseAPI = {
  getAll: (params?: any) => api.get("/courses", { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  enroll: (id: string, subjectId?: string) => api.post(`/courses/${id}/enroll`, { subjectId }),
  getEnrolled: () => api.get("/courses/enrolled/my-courses"),
  getEnrolledSubjects: (courseId: string) => api.get(`/courses/${courseId}/enrolled-subjects`),
  create: (data: any) => api.post("/courses", data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

/* ================= NOTES ================= */
export const noteAPI = {
  getAll: (params?: any) => api.get("/notes", { params }),
  getById: (id: string) => api.get(`/notes/${id}`),
  getByCourse: (courseId: string) => api.get(`/notes/course/${courseId}`),
  // For text/markdown notes (small payload) — use default 30s timeout
  create: (data: any) => api.post("/notes", data),
  update: (id: string, data: any) => api.put(`/notes/${id}`, data),
  // For file uploads (PDF/TXT can be several MB) — use 120s timeout
  upload: (data: FormData, onProgress?: (pct: number) => void) =>
    api.post("/notes", data, {
      timeout: 120000, // 2 minutes for large file uploads
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),
  uploadUpdate: (id: string, data: FormData, onProgress?: (pct: number) => void) =>
    api.put(`/notes/${id}`, data, {
      timeout: 120000,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),
  delete: (id: string) => api.delete(`/notes/${id}`),
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
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  create: (data: any) => api.post("/notifications/create", data),
  update: (id: string, data: any) => api.put(`/notifications/${id}`, data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

/* ================= ADMIN ================= */
export const adminAPI = {
  users: {
    getAll: (params?: any) => api.get("/admin/users", { params }),
    getById: (id: string) => api.get(`/admin/users/${id}`),
    update: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
    delete: (id: string) => api.delete(`/admin/users/${id}`),
    createStudent: (data: { name: string; email: string; password: string }) =>
      api.post("/admin/users/create-student", data),
  },
  students: {
    getAll: (params?: any) => api.get("/admin/students", { params }),
    getById: (id: string) => api.get(`/admin/students/${id}`),
    update: (id: string, data: any) => api.put(`/admin/students/${id}`, data),
    delete: (id: string) => api.delete(`/admin/students/${id}`),
  },
  dashboard: {
    getStats: () => api.get("/admin/dashboard/stats"),
  },
  analytics: {
    overview: () => api.get("/admin/analytics/overview"),
  },
  enrollStudent: (studentEmail: string, courseId: string, subjectId?: string, subjectName?: string) =>
    api.post("/admin/enroll-student", { studentEmail, courseId, subjectId, subjectName }),
};

/* ================= USER NOTES (PERSONAL LIBRARY) ================= */
export const userNoteAPI = {
  save: (noteId: string, category?: string) =>
    api.post("/user-notes/save", { noteId, category }),
  getAll: (params?: { category?: string; courseId?: string }) =>
    api.get("/user-notes", { params }),
  checkSaved: (noteId: string) => api.get(`/user-notes/check/${noteId}`),
  remove: (id: string) => api.delete(`/user-notes/${id}`),
  updateCategory: (id: string, category: string) =>
    api.put(`/user-notes/${id}/category`, { category }),
  markViewed: (id: string) => api.put(`/user-notes/${id}/view`),
};

/* ================= BANNERS ================= */
export const bannerAPI = {
  getAll: () => api.get("/banners"),
  getAllAdmin: () => api.get("/banners/all"),
  create: (data: any) => api.post("/banners", data),
  update: (id: string, data: any) => api.put(`/banners/${id}`, data),
  delete: (id: string) => api.delete(`/banners/${id}`),
};

/* ================= PAYMENTS ================= */
export const paymentAPI = {
  // Student
  submit: (data: any) => api.post("/payments/submit", data),
  getMyPayments: () => api.get("/payments/my"),
  getStatus: (courseId: string, subjectId?: string) =>
    api.get(`/payments/status/${courseId}`, { params: subjectId ? { subjectId } : undefined }),
  getCoursePaymentInfo: (courseId: string) => api.get(`/payments/course/${courseId}`),
  // Admin
  getAll: (params?: any) => api.get("/payments/admin", { params }),
  approve: (id: string, data?: { adminRemark?: string }) => api.put(`/payments/approve/${id}`, data),
  reject: (id: string, data: { adminRemark: string }) => api.put(`/payments/reject/${id}`, data),
};

export default api;
