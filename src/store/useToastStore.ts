import { create } from 'zustand';
import type { Toast } from '../types';
import { generateId } from '../utils/helpers';

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    addToast: (toast) => {
        const id = generateId();
        const newToast = { ...toast, id };

        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));

        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, toast.duration || 3000);
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
