"use client";

import { X } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start justify-between rounded-xl border p-3 shadow-md backdrop-blur",
            toast.type === "success" && "border-success/30 bg-success/10",
            toast.type === "error" && "border-danger/30 bg-danger/10",
            toast.type === "info" && "border-border bg-card",
          )}
        >
          <p className="text-sm font-medium text-foreground">{toast.message}</p>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="ml-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
