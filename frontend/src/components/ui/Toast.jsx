import { useToast } from "@/context/ToastContext";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/utils/cn";

const styles = {
  success: {
    icon: CheckCircle2,
    chip: "bg-emerald-100 text-emerald-600",
    bar: "from-emerald-500 to-teal-500",
  },
  error: {
    icon: XCircle,
    chip: "bg-rose-100 text-rose-600",
    bar: "from-rose-500 to-pink-500",
  },
  info: {
    icon: Info,
    chip: "bg-blue-100 text-blue-600",
    bar: "from-blue-500 to-violet-500",
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const config = styles[toast.variant];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto relative flex animate-toast-in items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/10"
            role="status"
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
                config.bar
              )}
            />
            <span className={cn("rounded-lg p-1.5", config.chip)}>
              <Icon className="size-4" />
            </span>
            <p className="flex-1 pt-0.5 text-sm text-slate-700">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}