import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import type { User } from '../types';
import { getDeviceId, getDeviceInfo } from '../utils/deviceId';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
    loading: boolean;
    /** Whether a device-mismatch session expiry has been detected */
    sessionExpired: boolean;
    /** Human-readable reason for session expiry */
    sessionExpiredReason: string;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    updateUser: (user: Partial<User>) => void;
    setToken: (token: string) => void;
    triggerSessionExpiry: (reason?: string) => void;
    clearSessionExpiry: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            loading: false,
            sessionExpired: false,
            sessionExpiredReason: '',

            // ── Login ────────────────────────────────────────────────────────
            login: async (email: string, password: string, forceLogout?: boolean) => {
                set({ loading: true });
                try {
                    const deviceId = getDeviceId();
                    const deviceInfo = getDeviceInfo();

                    const response: any = await authAPI.login({ email, password, deviceId, deviceInfo, forceLogout });
                    const { token, user } = response;

                    set({ user, token, isAuthenticated: true, loading: false, sessionExpired: false });
                } catch (error: any) {
                    set({ loading: false });
                    throw error; // re-throw full error so Login.tsx can inspect .code
                }
            },

            // ── Signup ───────────────────────────────────────────────────────
            signup: async (name: string, email: string, password: string) => {
                set({ loading: true });
                try {
                    const deviceId = getDeviceId();
                    const deviceInfo = getDeviceInfo();

                    const response: any = await authAPI.signup({ name, email, password, deviceId, deviceInfo });
                    const { token, user } = response;

                    set({ user, token, isAuthenticated: true, loading: false, sessionExpired: false });
                } catch (error: any) {
                    set({ loading: false });
                    throw new Error(error.message || 'Signup failed');
                }
            },

            // ── Logout ───────────────────────────────────────────────────────
            logout: async () => {
                try {
                    // Tell the server to clear device session + refresh token cookie
                    await authAPI.logout();
                } catch {
                    // Ignore errors — we still clear local state
                } finally {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        sessionExpired: false,
                        sessionExpiredReason: '',
                    });
                    localStorage.removeItem('auth-storage');
                }
            },

            // ── Silent token refresh ─────────────────────────────────────────
            refreshAccessToken: async (): Promise<boolean> => {
                try {
                    const response: any = await authAPI.refresh();
                    if (response?.token) {
                        set({ token: response.token, user: response.user, isAuthenticated: true });
                        return true;
                    }
                    return false;
                } catch {
                    // Refresh failed — user must log in again
                    set({ user: null, token: null, isAuthenticated: false });
                    return false;
                }
            },

            // ── Check auth on app load ────────────────────────────────────────
            checkAuth: async () => {
                const state = get();

                // If we have a token, verify it's still valid with the server
                if (state.token) {
                    try {
                        const response: any = await authAPI.getMe();
                        set({ user: response.user, isAuthenticated: true });
                    } catch (error: any) {
                        // Token may be expired — try silent refresh
                        if (error?.code === 'TOKEN_EXPIRED' || error?.status === 401) {
                            const refreshed = await get().refreshAccessToken();
                            if (!refreshed) {
                                set({ user: null, token: null, isAuthenticated: false });
                            }
                        } else {
                            set({ user: null, token: null, isAuthenticated: false });
                        }
                    }
                }
            },

            // ── Update user fields ────────────────────────────────────────────
            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            // ── Set token (used by OAuth callback) ────────────────────────────
            setToken: (token: string) => set({ token, isAuthenticated: true }),

            // ── Session expiry (device mismatch / forced logout) ──────────────
            triggerSessionExpiry: (reason = 'Your session was ended because this account logged in on another device.') => {
                set({
                    sessionExpired: true,
                    sessionExpiredReason: reason,
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
                localStorage.removeItem('auth-storage');
            },

            clearSessionExpiry: () =>
                set({ sessionExpired: false, sessionExpiredReason: '' }),
        }),
        {
            name: 'auth-storage',
            // Only persist token, user, and isAuthenticated — NOT sessionExpired
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
