import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Package,
  AlertTriangle,
  Boxes,
  FileText,
  FileCheck2,
  FileX2,
  ArrowRight,
  UserPlus,
  FilePlus2,
  ArrowLeftRight,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DonutChart } from "@/components/charts/DonutChart";
import { StockMovementChart } from "@/components/charts/StockMovementChart";
import { CHALLAN_STATUS_LABELS, CHALLAN_STATUS_STYLES, CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_STYLES } from "@/utils/constants";
import { formatDateTime } from "@/utils/format";

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardService
      .stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!stats) return <PageLoader label="Loading dashboard…" />;

  const { cards, charts, recent } = stats;

  const quickActions = [
    hasRole("SALES", "ADMIN") && {
      to: "/customers/new",
      label: "New Customer",
      icon: <UserPlus className="size-4" />,
    },
    hasRole("SALES", "ADMIN") && {
      to: "/challans/new",
      label: "New Challan",
      icon: <FilePlus2 className="size-4" />,
    },
    hasRole("WAREHOUSE", "ADMIN") && {
      to: "/stock-movements",
      label: "Record Stock",
      icon: <ArrowLeftRight className="size-4" />,
    },
    hasRole("ADMIN") && {
      to: "/products/new",
      label: "Add Product",
      icon: <PackagePlus className="size-4" />,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 shadow-lg shadow-blue-900/20 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-20 size-64 animate-float-slow rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 size-56 animate-float rounded-full bg-white/10 blur-2xl" style={{ animationDelay: "-4s" }} />
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-blue-100">
              <Sparkles className="size-3.5" />
              Operations Dashboard
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-white">
              Welcome back, {user?.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Here's your business at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" value={cards.totalCustomers} icon={<Users className="size-5" />} accent="blue" link={{ to: "/customers", label: "View customers" }} />
        <StatCard label="Active Customers" value={cards.activeCustomers} icon={<UserCheck className="size-5" />} accent="emerald" />
        <StatCard label="Total Products" value={cards.totalProducts} icon={<Package className="size-5" />} accent="violet" link={{ to: "/products", label: "View products" }} />
        <StatCard label="Low Stock Products" value={cards.lowStockProducts} icon={<AlertTriangle className="size-5" />} accent={cards.lowStockProducts > 0 ? "rose" : "emerald"} link={{ to: "/products?lowStock=true", label: "Review stock" }} />
        <StatCard label="Total Stock Units" value={cards.totalStockUnits} icon={<Boxes className="size-5" />} accent="slate" />
        <StatCard label="Draft Challans" value={cards.draftChallans} icon={<FileText className="size-5" />} accent="amber" link={{ to: "/challans?status=DRAFT", label: "View drafts" }} />
        <StatCard label="Confirmed Challans" value={cards.confirmedChallans} icon={<FileCheck2 className="size-5" />} accent="emerald" link={{ to: "/challans?status=CONFIRMED", label: "View confirmed" }} />
        <StatCard label="Cancelled Challans" value={cards.cancelledChallans} icon={<FileX2 className="size-5" />} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Challans by status" subtitle="Distribution of all sales challans" />
          <CardBody>
            <DonutChart
              data={[
                { name: "Draft", value: cards.draftChallans, color: "#f59e0b" },
                { name: "Confirmed", value: cards.confirmedChallans, color: "#10b981" },
                { name: "Cancelled", value: cards.cancelledChallans, color: "#f43f5e" },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Customer status" subtitle="Customer distribution by status" />
          <CardBody>
            <DonutChart
              data={[
                { name: "Lead", value: cards.leadCustomers, color: "#f59e0b" },
                { name: "Active", value: cards.activeCustomers, color: "#10b981" },
                {
                  name: "Inactive",
                  value: Math.max(0, cards.totalCustomers - cards.leadCustomers - cards.activeCustomers),
                  color: "#94a3b8",
                },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Stock movement summary" subtitle="Last 6 months (units)" />
          <CardBody>
            <StockMovementChart data={charts.stockMovementSeries} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent customers"
            subtitle="Latest customer records"
            action={<Link to="/customers" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all <ArrowRight className="inline size-3" /></Link>}
          />
          {recent.customers.length === 0 ? (
            <EmptyState title="No customers yet" description="Customers you create will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.customers.map((c) => (
                <Link key={c.id} to={`/customers/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{c.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{c.businessName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={CUSTOMER_STATUS_STYLES[c.status]}>{CUSTOMER_STATUS_LABELS[c.status]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent challans"
            subtitle="Latest sales challans"
            action={<Link to="/challans" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all <ArrowRight className="inline size-3" /></Link>}
          />
          {recent.challans.length === 0 ? (
            <EmptyState title="No challans yet" description="Sales challans you create will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.challans.map((ch) => (
                <Link key={ch.id} to={`/challans/${ch.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{ch.challanNumber}</p>
                    <p className="truncate text-xs text-slate-500">{ch.customer.customerName} · {ch.totalQuantity} units</p>
                  </div>
                  <Badge className={CHALLAN_STATUS_STYLES[ch.status]}>{CHALLAN_STATUS_LABELS[ch.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent stock movements"
            subtitle="Latest inventory activity"
            action={<Link to="/stock-movements" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all <ArrowRight className="inline size-3" /></Link>}
          />
          {recent.stockMovements.length === 0 ? (
            <EmptyState title="No stock movements yet" description="Stock changes will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.stockMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {m.product?.productName ?? "Unknown product"}
                      <span className="ml-1.5 text-xs text-slate-400">{m.product?.sku}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">{m.reason} · {formatDateTime(m.createdAt)}</p>
                  </div>
                  <Badge className={m.movementType === "IN" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}>
                    {m.movementType === "IN" ? "+" : "−"}{m.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Low stock products"
            subtitle="Products at or below minimum stock"
            action={<Link to="/products?lowStock=true" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all <ArrowRight className="inline size-3" /></Link>}
          />
          {recent.lowStockItems.length === 0 ? (
            <EmptyState title="All products in stock" description="No products are below their minimum stock level." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.lowStockItems.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.productName}</p>
                    <p className="truncate text-xs text-slate-500">{p.sku}</p>
                  </div>
                  <Badge className="bg-rose-50 text-rose-700 ring-rose-200">
                    {p.currentStock} / min {p.minimumStock}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}