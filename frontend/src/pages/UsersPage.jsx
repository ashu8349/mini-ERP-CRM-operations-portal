import { useEffect, useState } from "react";
import { ShieldCheck, Users as UsersIcon } from "lucide-react";
import { userService } from "@/services/user.service";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { ROLE_LABELS, ROLE_BADGE_STYLES } from "@/utils/constants";
import { formatDate } from "@/utils/format";

export function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService
      .list()
      .then((u) => {
        setUsers(u);
        setLoading(false);
      })
      .catch((err) => {
        showToast("error", err instanceof Error ? err.message : "Failed to load users");
        setLoading(false);
      });
  }, [showToast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Team members with access to OpsFlow ERP."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
            <UsersIcon className="size-4" />
            {users.length} users
          </span>
        }
      />

      <Card>
        {loading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Customers</th>
                  <th className="px-5 py-3 font-medium">Challans</th>
                  <th className="px-5 py-3 font-medium">Stock movements</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={ROLE_BADGE_STYLES[u.role]}>
                        <ShieldCheck className="size-3" />
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{u._count.customers}</td>
                    <td className="px-5 py-3 text-slate-700">{u._count.challans}</td>
                    <td className="px-5 py-3 text-slate-700">{u._count.stockMovements}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}