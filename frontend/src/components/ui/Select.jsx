import { forwardRef, useId } from "react";
import { cn } from "@/utils/cn";

export const Select = forwardRef(function Select(
  { label, error, options, placeholder, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 shadow-xs transition-all duration-200",
          "focus:border-blue-500 focus:shadow-md focus:shadow-blue-600/10 focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          error ? "border-rose-300" : "border-slate-300",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});