import { create } from 'zustand';

interface AuthModalState {
  isVisible: boolean;
  redirectTo: { name: string; params?: any } | null;
  onSuccess: (() => void) | null;
  openModal: (redirectTo?: { name: string; params?: any } | null, onSuccess?: (() => void) | null) => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isVisible: false,
  redirectTo: null,
  onSuccess: null,
  openModal: (redirectTo = null, onSuccess = null) => set({ isVisible: true, redirectTo, onSuccess }),
  closeModal: () => set({ isVisible: false, redirectTo: null, onSuccess: null }),
}));
