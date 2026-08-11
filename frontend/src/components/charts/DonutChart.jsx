export function DonutChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const seg = {
      ...d,
      dash: `${Math.max(0, fraction * circumference - 2)} ${circumference}`,
      offset: -offset,
    };
    offset += fraction * circumference;
    return seg;
  });

  const gap = 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-40">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {segments.map((s) => (
            <circle
              key={s.name}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              className="animate-draw"
              style={{
                "--draw-from": circumference + gap,
                "--draw-to": s.offset,
                animationDelay: `${data.indexOf(s) * 220}ms`,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-slate-900">
            {total.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-slate-500">Total</span>
        </div>
      </div>
      <div className="w-full space-y-2">
        {title && <p className="text-xs font-medium text-slate-500">{title}</p>}
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-600">{d.name}</span>
            </div>
            <span className="font-medium text-slate-800">
              {d.value.toLocaleString("en-IN")}
              {total > 0 && (
                <span className="ml-1 text-xs text-slate-400">
                  ({Math.round((d.value / total) * 100)}%)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}