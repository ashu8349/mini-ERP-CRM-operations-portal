import { cn } from "@/utils/cn";

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600",
        className
      )}
      aria-label="Loading"
    />
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <span className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
        <Spinner className="relative size-9 border-slate-200 border-t-blue-600" />
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}