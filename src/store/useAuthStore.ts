import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            loading: false,

            login: async (email: string, password: string) => {
                set({ loading: true });
                try {
                    const response: any = await authAPI.login({ email, password });
                    const { token, user } = response;

                    set({ user, token, isAuthenticated: true, loading: false });
                } catch (error: any) {
                    set({ loading: false });
                    throw new Error(error.message || 'Login failed');
                }
            },

            signup: async (name: string, email: string, password: string) => {
                set({ loading: true });
                try {
                    const response: any = await authAPI.signup({ name, email, password });
                    const { token, user } = response;

                    set({ user, token, isAuthenticated: true, loading: false });
                } catch (error: any) {
                    set({ loading: false });
                    throw new Error(error.message || 'Signup failed');
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                const storedState = localStorage.getItem('auth-storage');
                if (!storedState) {
                    return; // Just return, don't clear state
                }

                try {
                    const parsed = JSON.parse(storedState);
                    if (parsed?.state?.token) {
                        const response: any = await authAPI.getMe();
                        set({ user: response.user, isAuthenticated: true });
                    }
                } catch (error) {
                    // Silently fail - user not logged in, this is expected
                }
            },

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
        }),
        {
            name: 'auth-storage',
        }
    )
);
