import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User | null, accessToken: string | null, refreshToken: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => Promise<void>;
  updateProfile: (payload: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken, isAuthenticated: !!accessToken });
    if (accessToken) {
      await secureStorage.setItem('accessToken', accessToken);
    } else {
      await secureStorage.removeItem('accessToken');
    }
    if (refreshToken) {
      await secureStorage.setItem('refreshToken', refreshToken);
    } else {
      await secureStorage.removeItem('refreshToken');
    }
  },

  clearAuth: async () => {
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    await secureStorage.removeItem('accessToken');
    await secureStorage.removeItem('refreshToken');
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await secureStorage.getItem('accessToken');
      const refreshToken = await secureStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Set tokens in store temporarily so the getMe call can use them in the interceptor
      set({ accessToken, refreshToken });

      // Validate the token with the backend
      const response = await authService.getMe();
      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token is invalid, clear auth
        await get().clearAuth();
      }
    } catch (e) {
      console.error('Failed to initialize auth', e);
      // Network error or token validation failed, clear auth
      await get().clearAuth();
    }
  },

  updateUser: (updatedUser) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updatedUser } });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Silent authService.logout error:', err);
    }
    await get().clearAuth();
  },

  updateProfile: async (payload) => {
    try {
      const response = await authService.updateProfile(payload);
      if (response.success && response.user) {
        get().updateUser(response.user);
      }
    } catch (error: any) {
      throw error;
    }
  },
}));
