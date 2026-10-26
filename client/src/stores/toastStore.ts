import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toast: Toast | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, tone = 'default') => set({ toast: { id: Date.now(), message, tone } }),
  dismiss: () => set({ toast: null }),
}));
