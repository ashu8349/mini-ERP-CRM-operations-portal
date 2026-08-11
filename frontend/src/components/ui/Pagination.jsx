import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1 && total === 0) return null;
  const from = (page - 1) * 10 + 1;
  const to = Math.min(page * 10, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{total === 0 ? 0 : from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className={cn(
            "inline-flex items-center rounded-md p-1.5 transition-colors",
            page <= 1 ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-100"
          )}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p) => {
            if (acc.length && acc[acc.length - 1] !== p - 1) {
              acc.push(-1);
            }
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === -1 ? (
              <span key={`gap-${idx}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-w-8 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  p === page
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {p}
              </button>
            )
          )}
        <button
          className={cn(
            "inline-flex items-center rounded-md p-1.5 transition-colors",
            page >= totalPages ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-100"
          )}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}