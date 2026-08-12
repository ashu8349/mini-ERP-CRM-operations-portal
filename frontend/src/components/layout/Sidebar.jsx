import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ArrowLeftRight,
  Settings,
  ShieldCheck,
  Boxes,
  Warehouse,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { ROLE_LABELS } from "@/utils/constants";

const ROLE_TEXT_STYLES = {
  ADMIN: "text-violet-600",
  SALES: "text-blue-600",
  WAREHOUSE: "text-amber-600",
  ACCOUNTS: "text-emerald-600",
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"], end: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/customers", label: "Customers", icon: <Users className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { to: "/products", label: "Products", icon: <Package className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { to: "/inventory", label: "Inventory", icon: <Boxes className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { to: "/challans", label: "Sales Challans", icon: <FileText className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
      { to: "/stock-movements", label: "Stock Movements", icon: <ArrowLeftRight className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: <ShieldCheck className="size-4" />, roles: ["ADMIN"] },
      { to: "/settings", label: "Settings", icon: <Settings className="size-4" />, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    ],
  },
];

export function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-900/20">
          <Warehouse className="size-5" />
        </span>
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-slate-900">
            OpsFlow <span className="text-gradient">ERP</span>
          </p>
          <p className="text-[11px] font-medium text-slate-500">Operations Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => item.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-900/20"
                          : "text-slate-600 hover:bg-blue-50/70 hover:text-blue-700"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cn("transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")}>
                          {item.icon}
                        </span>
                        {item.label}
                        {isActive && (
                          <ChevronRight className="ml-auto size-3.5 opacity-70" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-semibold text-white shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className={cn("text-[11px] font-semibold", ROLE_TEXT_STYLES[user.role])}>
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <button
            onClick={() => {
              onNavigate?.();
              logout();
            }}
            title="Log out"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-slate-400">
          OpsFlow ERP v1.0
        </p>
      </div>
    </aside>
  );
}