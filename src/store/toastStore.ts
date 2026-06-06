import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
  onDismiss?: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  durationMs?: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  add: (
    message: string,
    type?: ToastType,
    duration?: number,
    action?: ToastAction,
  ) => string;
  remove: (id: string, options?: { userDismissed?: boolean }) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  add(message, type = "info", duration = 3000, action) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const durationMs = duration > 0 ? duration : undefined;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, durationMs, action }],
    }));
    if (durationMs != null) {
      setTimeout(() => get().remove(id), durationMs);
    }
    return id;
  },
  remove(id, options) {
    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (options?.userDismissed) toast?.action?.onDismiss?.();
      return { toasts: state.toasts.filter((t) => t.id !== id) };
    });
  },
}));
