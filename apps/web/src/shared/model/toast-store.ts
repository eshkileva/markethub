import { create } from 'zustand';

export type ToastVariant = 'error' | 'success' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 6000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'error') => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export function toast(message: string, variant: ToastVariant = 'error') {
  useToastStore.getState().push(message, variant);
}
