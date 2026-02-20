"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type TenantUser = { id: string; email: string; emailVerified: boolean; createdAt: string };

type Tenant = {
  id: string;
  name: string;
  contactPerson: string;
  createdAt: string;
  subscription: { planName: string; status: string; endDate: string } | null;
  users?: TenantUser[];
};

type Plan = { id: string; name: string; durationMonths: number; price: number; currency: string; isActive: boolean };

export default function AdminTenantsContent() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState<string | null>(null);
  const [extendModal, setExtendModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendPlanId, setExtendPlanId] = useState<string>("");
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.admin.tenants(), api.admin.plans()])
      .then(([t, p]) => {
        setTenants(t);
        const activePlans = p.filter((x) => x.isActive);
        setPlans(activePlans);
        if (activePlans.length > 0 && !extendPlanId) setExtendPlanId(activePlans[0].id);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExtend = async (tenantId: string, months?: number, planId?: string) => {
    setExtending(tenantId);
    try {
      await api.admin.extendSubscription(tenantId, months ?? extendMonths, planId ?? (extendPlanId || undefined));
      const list = await api.admin.tenants();
      setTenants(list);
      setExtendModal(null);
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setExtending(null);
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    setVerifying(userId);
    try {
      await api.admin.verifyUserEmail(userId);
      const list = await api.admin.tenants();
      setTenants(list);
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setVerifying(null);
    }
  };

  const openExtendModal = (t: Tenant) => {
    setExtendModal({ tenantId: t.id, tenantName: t.name });
    setExtendMonths(t.subscription?.planName?.includes("12") ? 12 : t.subscription?.planName?.includes("6") ? 6 : t.subscription?.planName?.includes("3") ? 3 : 1);
    if (plans.length > 0 && !extendPlanId) setExtendPlanId(plans[0].id);
  };

  if (loading) {
    return (
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Şirkət</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">İstifadəçilər</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Plan</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Bitmə</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700"></th>
          </tr>
        </thead>
        <tbody>
          {tenants.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                Tenant tapılmadı
              </td>
            </tr>
          ) : (
            tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {(t.users ?? []).map((u) => (
                      <div key={u.id} className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-700">{u.email}</span>
                        {u.emailVerified ? (
                          <span className="text-xs text-green-600">✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerifyEmail(u.id)}
                            disabled={verifying === u.id}
                            className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50"
                          >
                            {verifying === u.id ? "..." : "Təsdiqlə"}
                          </button>
                        )}
                      </div>
                    ))}
                    {(t.users ?? []).length === 0 && <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{t.subscription?.planName ?? "-"}</td>
                <td className="px-4 py-3">
                  {t.subscription ? (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        t.subscription.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : t.subscription.status === "Expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.subscription.status}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.subscription?.endDate
                    ? new Date(t.subscription.endDate).toLocaleDateString("az-AZ")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  {t.name.includes("System") ? null : (
                    <button
                      onClick={() => openExtendModal(t)}
                      disabled={extending === t.id}
                      className="text-primary-600 hover:underline disabled:opacity-50"
                    >
                      {extending === t.id ? "..." : "Uzat"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {extendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-2">Abunə uzat: {extendModal.tenantName}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Plan</label>
                <select
                  value={extendPlanId || plans[0]?.id || ""}
                  onChange={(e) => setExtendPlanId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.price} {p.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Müddət (ay)</label>
                <input
                  type="number"
                  min={1}
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleExtend(extendModal.tenantId)}
                disabled={extending === extendModal.tenantId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {extending === extendModal.tenantId ? "..." : "Təsdiq"}
              </button>
              <button
                onClick={() => setExtendModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Ləğv
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
