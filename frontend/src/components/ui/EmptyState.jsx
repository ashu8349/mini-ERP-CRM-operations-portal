import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-4 text-slate-400 ring-1 ring-inset ring-blue-100">
        <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-blue-400/30" />
        <span className="absolute -bottom-1 -left-1 size-2 rounded-full bg-violet-400/30" />
        <Inbox className="size-7" />
      </span>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}