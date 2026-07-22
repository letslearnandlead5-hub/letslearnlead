import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { secureStorage } from '../utils/secureStorage';
import { navigationRef } from '../navigation/navigationRef';

// Dynamically resolve useAuthStore to avoid circular dependency issues at startup
const getAuthStore = () => {
  return require('../store/useAuthStore').useAuthStore;
};


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ─── Attach JWT token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = getAuthStore().getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─── Handle 401 / token refresh ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if the refresh route itself fails with 401
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getAuthStore().getState().refreshToken || await secureStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Cookie: `refreshToken=${storedRefreshToken}`,
            },
          }
        );

        if (response.data.success && response.data.token) {
          const newAccessToken = response.data.token;
          
          // Attempt to extract rotated refresh token from set-cookie headers
          const setCookieHeaders = response.headers?.['set-cookie'];
          let newRefreshToken = storedRefreshToken;
          if (setCookieHeaders && setCookieHeaders.length > 0) {
            const match = setCookieHeaders[0].match(/refreshToken=([^;]+)/);
            if (match && match[1]) {
              newRefreshToken = match[1];
            }
          }

          // Save new tokens in state and storage
          await getAuthStore().getState().setAuth(
            response.data.user || getAuthStore().getState().user,
            newAccessToken,
            newRefreshToken
          );

          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh token rotation failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        console.warn('[AXIOS 401] Token expired and refresh failed -> clearing auth state');
        await getAuthStore().getState().clearAuth();
        try {
          const { useAuthModalStore } = require('../store/useAuthModalStore');
          useAuthModalStore.getState().openModal({ name: 'ProfileTab' });
        } catch {}
        
        return Promise.reject(refreshError);
      }
    }

    // Normalize error message for UI
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Please try again.';

    error.userMessage = message;
    error.code = error.response?.data?.code;
    return Promise.reject(error);
  }
);

export default api;
