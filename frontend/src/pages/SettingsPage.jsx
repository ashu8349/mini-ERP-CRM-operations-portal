import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CircleUserRound,
  KeyRound,
  LogOut,
  ShieldCheck,
  ShieldQuestion,
  Info,
  UserCog,
  Users as UsersIcon,
  KeySquare,
  Power,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/Spinner";
import { ROLE_LABELS, ROLE_BADGE_STYLES, APP_NAME } from "@/utils/constants";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(/[A-Za-z]/, "New password must contain at least one letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const ROLE_PERMISSIONS = [
  {
    role: "ADMIN",
    permissions: ["Full system access — manage customers, products, stock, challans and users."],
  },
  {
    role: "SALES",
    permissions: ["Manage customers", "Add follow-ups", "View products", "Create and confirm sales challans"],
  },
  {
    role: "WAREHOUSE",
    permissions: ["View products", "View inventory", "View stock movements", "Record stock adjustments"],
  },
  {
    role: "ACCOUNTS",
    permissions: ["View customers", "View confirmed challans", "View sales information"],
  },
];

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(isAdmin);
  const [busyUserId, setBusyUserId] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  useEffect(() => {
    if (!isAdmin) return;
    userService
      .list()
      .then((u) => {
        setUsers(u);
        setUsersLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load users");
        setUsersLoading(false);
      });
  }, [isAdmin, showToast]);

  if (!user) return null;

  const onLogout = () => {
    logout();
    showToast("info", "You have been logged out");
    navigate("/login", { replace: true });
  };

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      passwordForm.reset();
      showToast("success", "Password changed successfully");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to change password");
    }
  });

  const onRoleChange = async (targetUser, role) => {
    if (role === targetUser.role) return;
    setBusyUserId(targetUser.id);
    try {
      await userService.updateRole(targetUser.id, role);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role } : u)));
      showToast("success", `${targetUser.name}'s role updated to ${ROLE_LABELS[role]}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUserId(null);
    }
  };

  const onActivate = async (targetUser) => {
    setBusyUserId(targetUser.id);
    try {
      await userService.updateStatus(targetUser.id, true);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: true } : u)));
      showToast("success", `${targetUser.name} has been activated`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to activate user");
    } finally {
      setBusyUserId(null);
    }
  };

  const onConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setBusyUserId(deactivateTarget.id);
    try {
      await userService.updateStatus(deactivateTarget.id, false);
      setUsers((prev) =>
        prev.map((u) => (u.id === deactivateTarget.id ? { ...u, isActive: false } : u))
      );
      showToast("success", `${deactivateTarget.name} has been deactivated`);
      setDeactivateTarget(null);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to deactivate user");
    } finally {
      setBusyUserId(null);
    }
  };

  const onResetPassword = resetForm.handleSubmit(async (values) => {
    if (!resetTarget) return;
    try {
      await userService.resetPassword(resetTarget.id, values.newPassword);
      setResetTarget(null);
      resetForm.reset();
      showToast("success", `Password reset for ${resetTarget.name}`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to reset password");
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Manage your account and application preferences." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Account information"
            subtitle="Your profile details"
            action={
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CircleUserRound className="size-4" />
              </span>
            }
          />
          <CardBody className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
                <div className="mt-1.5">
                  <Badge className={ROLE_BADGE_STYLES[user.role]}>
                    <ShieldCheck className="size-3" />
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Account status</p>
                <div className="mt-1.5">
                  <Badge
                    className={
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                        : "bg-rose-100 text-rose-700 ring-rose-200"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="Update the password for your account" />
          <CardBody>
            <form onSubmit={onChangePassword} className="space-y-4">
              <Input
                type="password"
                label="Current password"
                placeholder="Enter your current password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register("currentPassword")}
              />
              <Input
                type="password"
                label="New password"
                placeholder="At least 8 characters with letters and numbers"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register("newPassword")}
              />
              <Input
                type="password"
                label="Confirm new password"
                placeholder="Re-enter your new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register("confirmPassword")}
              />
              <Button
                type="submit"
                variant="primary"
                loading={passwordForm.formState.isSubmitting}
                className="w-full"
              >
                <KeyRound className="size-4" />
                Change password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Role permissions" subtitle="What your role can do in the application" />
        <div className="divide-y divide-slate-100">
          {ROLE_PERMISSIONS.map((rp) => {
            const isCurrent = rp.role === user.role;
            return (
              <div key={rp.role} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex w-full items-center justify-between gap-3 sm:w-44 sm:shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldQuestion className="size-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{ROLE_LABELS[rp.role]}</span>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-blue-100 text-blue-700 ring-blue-200">Your role</Badge>
                  )}
                </div>
                <ul className="flex-1 space-y-1 text-sm text-slate-600">
                  {rp.permissions.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader
            title="User management"
            subtitle="View users, manage roles, activate/deactivate accounts and reset passwords"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                <UsersIcon className="size-3.5" />
                {users.length} users
              </span>
            }
          />
          {usersLoading ? (
            <PageLoader label="Loading users…" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.id === user.id;
                    const busy = busyUserId === u.id;
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                                u.isActive ? "bg-blue-600" : "bg-slate-400"
                              }`}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">
                                {u.name}
                                {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                              </p>
                              <p className="truncate text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Select
                            className="w-40"
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => onRoleChange(u, e.target.value)}
                            options={ROLE_OPTIONS}
                            aria-label={`Role for ${u.name}`}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            className={
                              u.isActive
                                ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                : "bg-rose-100 text-rose-700 ring-rose-200"
                            }
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.isActive ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={isSelf || busy}
                                loading={busy}
                                onClick={() => setDeactivateTarget(u)}
                              >
                                <Power className="size-3.5" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="success"
                                size="sm"
                                disabled={isSelf || busy}
                                loading={busy}
                                onClick={() => onActivate(u)}
                              >
                                <CheckCircle2 className="size-3.5" />
                                Activate
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isSelf || busy}
                              onClick={() => {
                                resetForm.reset();
                                setResetTarget(u);
                              }}
                            >
                              <KeySquare className="size-3.5" />
                              Reset password
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Application information" subtitle="About this application" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Info className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{APP_NAME}</p>
                <p className="text-xs text-slate-500">Version 1.0.0</p>
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <p className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Application name</span>
                <span className="font-medium text-slate-700">{APP_NAME}</span>
              </p>
              <p className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Version</span>
                <span className="font-mono text-slate-700">1.0.0</span>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Logout" subtitle="End your session securely" />
          <CardBody className="flex flex-1 flex-col justify-between gap-4">
            <p className="text-sm text-slate-600">
              You are logged in as <span className="font-medium text-slate-800">{user.name}</span>{" "}
              ({user.email}). Logging out will return you to the login screen.
            </p>
            <Button variant="danger" className="w-full" onClick={onLogout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={deactivateTarget !== null}
        title={`Deactivate ${deactivateTarget?.name ?? ""}?`}
        message="The user will no longer be able to log in or use the application until reactivated."
        confirmLabel="Deactivate"
        variant="danger"
        loading={busyUserId === deactivateTarget?.id}
        onConfirm={onConfirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      <Modal
        open={resetTarget !== null}
        title={`Reset password — ${resetTarget?.name ?? ""}`}
        subtitle="Set a new password for this user"
        size="sm"
        onClose={() => setResetTarget(null)}
      >
        <form onSubmit={onResetPassword} className="space-y-4">
          <Input
            type="password"
            label="New password"
            placeholder="At least 8 characters with letters and numbers"
            error={resetForm.formState.errors.newPassword?.message}
            {...resetForm.register("newPassword")}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={resetForm.formState.isSubmitting}
          >
            <UserCog className="size-4" />
            Reset password
          </Button>
        </form>
      </Modal>
    </div>
  );
}