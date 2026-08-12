import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const accentStyles = {
  blue: {
    card: "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50",
    chip: "bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sm shadow-sky-500/30",
    bar: "from-sky-300 to-blue-400",
  },
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    chip: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-500/30",
    bar: "from-emerald-300 to-teal-400",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    chip: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30",
    bar: "from-amber-300 to-orange-400",
  },
  rose: {
    card: "border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50",
    chip: "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-sm shadow-rose-500/30",
    bar: "from-rose-300 to-pink-400",
  },
  violet: {
    card: "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-purple-50",
    chip: "bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-sm shadow-violet-500/30",
    bar: "from-violet-300 to-purple-400",
  },
  slate: {
    card: "border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100",
    chip: "bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm shadow-slate-500/30",
    bar: "from-slate-300 to-slate-400",
  },
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
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          accentStyles[accent].bar
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-800">
            {animated.toLocaleString("en-IN")}
          </p>
        </div>
        <span className={cn("rounded-xl p-2.5", accentStyles[accent].chip)}>{icon}</span>
      </div>
      {link && (
        <p className="mt-3 text-xs font-medium text-blue-600 transition-colors group-hover:text-blue-700">
          {link.label}
        </p>
      )}
    </>
  );

  const className =
    "group relative block overflow-hidden rounded-2xl border p-5 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5";

  const cardClass = cn(className, accentStyles[accent].card);

  if (onClick) {
    return (
      <button className={cn(cardClass, "text-left")} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={cardClass} onClick={link ? () => undefined : undefined}>
      {inner}
    </div>
  );
}