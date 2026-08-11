export function StockMovementChart({ data }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.IN, d.OUT]));
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-gradient-to-br from-emerald-500 to-teal-400" />{" "}
          Stock In
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-gradient-to-br from-rose-500 to-orange-400" />{" "}
          Stock Out
        </span>
      </div>
      <div className="relative h-48">
        {gridLines.map((g) => (
          <div
            key={g}
            className="absolute inset-x-0 border-t border-dashed border-slate-200"
            style={{ bottom: `${g * 100}%` }}
          />
        ))}
        <div className="absolute inset-0 flex items-end justify-between gap-2">
          {data.map((point, index) => (
            <div
              key={point.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-full w-full max-w-10 items-end justify-center gap-1">
                <div
                  className="w-3.5 origin-bottom animate-grow rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-colors hover:from-emerald-500"
                  style={{
                    height: `${(point.IN / max) * 100}%`,
                    animationDelay: `${index * 90}ms`,
                  }}
                  title={`${point.label}: IN ${point.IN}`}
                />
                <div
                  className="w-3.5 origin-bottom animate-grow rounded-t-md bg-gradient-to-t from-rose-600 to-orange-400 transition-colors hover:from-rose-500"
                  style={{
                    height: `${(point.OUT / max) * 100}%`,
                    animationDelay: `${index * 90 + 45}ms`,
                  }}
                  title={`${point.label}: OUT ${point.OUT}`}
                />
              </div>
              <span className="text-[11px] text-slate-500">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}