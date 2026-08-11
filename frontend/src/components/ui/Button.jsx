import { cn } from "@/utils/cn";

const variantStyles = {
  primary:
    "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-900/20 hover:from-blue-700 hover:to-violet-700 focus-visible:outline-blue-600",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400",
  danger:
    "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-900/20 hover:from-rose-700 hover:to-rose-600 focus-visible:outline-rose-600",
  success:
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20 hover:from-emerald-700 hover:to-teal-700 focus-visible:outline-emerald-600",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-3.5 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}