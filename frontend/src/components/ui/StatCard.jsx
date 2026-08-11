import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const accentStyles = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-900/20",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-900/20",
  rose: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-900/20",
  violet: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-900/20",
  slate: "bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-md shadow-slate-900/20",
};

function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export function StatCard({ label, value, icon, accent = "blue", link, onClick }) {
  const animated = useCountUp(value);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">
            {animated.toLocaleString("en-IN")}
          </p>
        </div>
        <span className={cn("rounded-xl p-2.5", accentStyles[accent])}>{icon}</span>
      </div>
      {link && (
        <p className="mt-3 text-xs font-medium text-blue-600 transition-colors group-hover:text-blue-700">
          {link.label}
        </p>
      )}
    </>
  );

  const className =
    "group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5";

  if (onClick) {
    return (
      <button className={cn(className, "text-left")} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={className} onClick={link ? () => undefined : undefined}>
      {inner}
    </div>
  );
}