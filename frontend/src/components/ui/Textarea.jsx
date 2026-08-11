import { forwardRef, useId } from "react";
import { cn } from "@/utils/cn";

const fieldClasses =
  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:shadow-md focus:shadow-blue-600/10 focus:outline-none";

export const Textarea = forwardRef(function Textarea(
  { label, error, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          fieldClasses,
          error ? "border-rose-300 focus:border-rose-500" : "border-slate-300",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});