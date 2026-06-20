import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { onToast, type ToastItem } from "@/utils/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastItem & { timer: number })[]>([]);

  useEffect(() => {
    const unsub = onToast((toast) => {
      const newToast = {
        ...toast,
        timer: window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 5000),
      };
      setToasts((prev) => [...prev, newToast]);
    });
    return () => {
      unsub();
      toasts.forEach((t) => clearTimeout(t.timer));
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  };

  const colorVarMap = {
    success: "var(--success)",
    error: "var(--danger)",
    info: "var(--accent)",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg"
          style={{
            borderColor: colorVarMap[t.type],
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
        >
          <span style={{ color: colorVarMap[t.type] }}>{iconMap[t.type]}</span>
          <span className="flex-1 text-sm">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 rounded p-0.5 hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
