import { ShieldX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="rounded-full bg-rose-50 p-4 text-rose-500">
          <ShieldX className="size-8" />
        </span>
        <h2 className="text-lg font-semibold text-slate-800">Access denied</h2>
        <p className="max-w-sm text-sm text-slate-500">
          You do not have permission to view this page. Contact an administrator if you believe
          this is a mistake.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}