import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Warehouse } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function BrandLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-12 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-900/20">
          <Warehouse className="size-6" />
        </span>
        <div className="text-center">
          <p className="font-display text-sm font-semibold text-slate-700">Loading OpsFlow ERP…</p>
          <div className="mx-auto mt-3 h-1 w-28 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-slide rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <BrandLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main
          key={location.pathname}
          className="flex-1 animate-fade-up overflow-y-auto p-4 sm:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}