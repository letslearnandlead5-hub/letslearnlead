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

      console.log(`[AUTH INIT] Checking stored tokens... tokenPresent=${!!accessToken}`);

      if (!accessToken || !refreshToken) {
        console.log('[AUTH INIT] No tokens found in secure storage. State: Unauthenticated.');
        await get().clearAuth();
        return;
      }

      // Set tokens in store temporarily so getMe can pass Authorization header
      set({ accessToken, refreshToken });

      // Validate the token with the backend
      const response = await authService.getMe();
      if (response.success && response.user) {
        console.log(`[AUTH INIT SUCCESS] User authenticated: ${response.user.name} (${response.user.email})`);
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.warn('[AUTH INIT FAILED] Token validation failed. Purging stale auth.');
        await get().clearAuth();
      }
    } catch (e: any) {
      console.error('[AUTH INIT ERROR] Token initialization failed:', e?.message || e);
      // Network error or token validation failed -> clear stale state safely
      await get().clearAuth();
    } finally {
      set({ isLoading: false });
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
