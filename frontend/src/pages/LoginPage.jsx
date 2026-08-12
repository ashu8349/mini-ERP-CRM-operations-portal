import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail, Warehouse, Boxes, FileText, Handshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { APP_NAME, APP_SUBTITLE } from "@/utils/constants";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@example.com" },
  { role: "Sales", email: "sales@example.com" },
  { role: "Warehouse", email: "warehouse@example.com" },
  { role: "Accounts", email: "accounts@example.com" },
];

const FEATURES = [
  { icon: <Boxes className="size-4" />, label: "Real-time inventory" },
  { icon: <FileText className="size-4" />, label: "Auto-numbered challans" },
  { icon: <Handshake className="size-4" />, label: "CRM follow-ups" },
];

const ROLE_PILLS = [
  { label: "Admin", className: "ring-violet-300/50 text-violet-200 hover:bg-violet-500/20" },
  { label: "Sales", className: "ring-blue-300/50 text-blue-200 hover:bg-blue-500/20" },
  { label: "Warehouse", className: "ring-amber-300/50 text-amber-200 hover:bg-amber-500/20" },
  { label: "Accounts", className: "ring-emerald-300/50 text-emerald-200 hover:bg-emerald-500/20" },
];

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      showToast("success", "Logged in successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 size-96 animate-float-slow rounded-full bg-blue-600/30 blur-3xl" />
          <div
            className="absolute right-0 top-1/3 size-80 animate-float rounded-full bg-violet-600/25 blur-3xl"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute -bottom-24 left-1/4 size-96 animate-float-slow rounded-full bg-emerald-500/15 blur-3xl"
            style={{ animationDelay: "-5s" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,rgba(59,130,246,0.12),transparent_60%)]" />
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-900/40">
              <Warehouse className="size-6" />
            </span>
            <div>
              <p className="font-display text-base font-bold tracking-tight text-white">
                {APP_NAME}
              </p>
              <p className="text-xs text-slate-400">{APP_SUBTITLE}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Run your entire wholesale operation{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              from one console
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Customers, inventory, stock movements and sales challans — with role-based access,
            atomic stock updates and audit trails built in.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/10"
              >
                <span className="text-blue-300">{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            {ROLE_PILLS.map((pill) => (
              <span
                key={pill.label}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${pill.className}`}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <p className="border-t border-white/10 pt-5 text-xs text-slate-500">
            Draft challan → confirm → atomic stock deduction → updated inventory. The full
            money-to-stock journey, end to end.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 text-center lg:hidden">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-900/30">
              <Warehouse className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-slate-500">{APP_SUBTITLE}</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
          >
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-slate-500">Use your work email and password.</p>

            <div className="mt-6 space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                error={errors.email?.message}
                rightElement={<Mail className="size-4 text-slate-400" />}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                rightElement={<Lock className="size-4 text-slate-400" />}
                {...register("password")}
              />
            </div>

            <Button type="submit" loading={submitting} className="mt-6 w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo accounts
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setValue("email", acc.email);
                  }}
                  className="group rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <span className="block text-xs font-semibold text-slate-800">
                    {acc.role}
                    <span className="ml-1.5 text-[10px] text-blue-500 opacity-0 transition-opacity group-hover:opacity-100">
                      fill →
                    </span>
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">{acc.email}</span>
                  <span className="block text-[10px] text-slate-300">ask admin for password</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}