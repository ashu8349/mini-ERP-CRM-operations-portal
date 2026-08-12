import { cn } from "@/utils/cn";

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-900/5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}