import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { Storage } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ─── Attach JWT token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await Storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─── Handle 401 / errors ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and let AuthContext handle navigation
      await Storage.clearAll();
    }

    // Normalize error message for UI
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Please try again.';

    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
