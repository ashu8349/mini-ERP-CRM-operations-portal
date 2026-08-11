import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, BellRing, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/services/dashboard.service";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, ROLE_BADGE_STYLES } from "@/utils/constants";

export function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    dashboardService
      .stats()
      .then((s) => {
        if (cancelled) return;
        const items = [];
        for (const p of s.recent.lowStockItems) {
          items.push({
            id: `ls-${p.id}`,
            kind: "low-stock",
            title: `Low stock: ${p.productName}`,
            detail: `${p.currentStock} left (min ${p.minimumStock})`,
            to: `/products/${p.id}`,
          });
        }
        if (s.cards.draftChallans > 0) {
          items.push({
            id: "drafts",
            kind: "draft",
            title: `${s.cards.draftChallans} draft challan${s.cards.draftChallans > 1 ? "s" : ""} awaiting confirmation`,
            detail: "Draft challans do not affect stock",
            to: "/challans?status=DRAFT",
          });
        }
        setNotifications(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>
        <div className="hidden sm:block">
          <p className="font-display text-sm font-semibold text-slate-800">Welcome back</p>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" ref={bellRef}>
          <button
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
            onClick={() => setBellOpen((v) => !v)}
          >
            {notifications.length > 0 ? (
              <BellRing className="size-5" />
            ) : (
              <Bell className="size-5" />
            )}
            {notifications.length > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-slate-800">
                  Notifications
                  {notifications.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {notifications.length} active
                    </span>
                  )}
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">
                    All clear — no alerts right now.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.to}
                      onClick={() => setBellOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <span
                        className={
                          n.kind === "low-stock"
                            ? "mt-0.5 rounded-full bg-rose-50 p-1.5 text-rose-600"
                            : "mt-0.5 rounded-full bg-amber-50 p-1.5 text-amber-600"
                        }
                      >
                        {n.kind === "low-stock" ? (
                          <BellRing className="size-3.5" />
                        ) : (
                          <Bell className="size-3.5" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{n.detail}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-slate-100"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 p-[2px]">
              <span className="flex size-full items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-slate-800">{user.name}</span>
              <Badge className={ROLE_BADGE_STYLES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
            </span>
            {menuOpen ? <X className="size-4 text-slate-400" /> : null}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}