type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let listeners: ((toast: ToastItem) => void)[] = [];
let counter = 0;

export function addToast(message: string, type: ToastType = "info") {
  const toast: ToastItem = { id: String(++counter), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function onToast(fn: (toast: ToastItem) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}
