"use client";

import { useCallback, useEffect, useState } from "react";
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

type TenantDetail = {
  tenant: { id: string; name: string; contactPerson: string; taxId?: string; country?: string; city?: string; createdAt: string };
  users: { id: string; email: string; emailVerified: boolean; createdAt: string; lastLoginAt?: string; role: string }[];
  subscription: { name: string; status: string; endDate: string } | null;
  payments: { id: string; amount: number; currency: string; status: string; provider: string; date: string }[];
  tickets: { id: string; subject: string; status: string; date: string }[];
};

export default function AdminTenantsContent() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState<string | null>(null);
  const [extendModal, setExtendModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendPlanId, setExtendPlanId] = useState<string>("");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<TenantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; email: string; phone?: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingTenant, setDeletingTenant] = useState(false);

  const refreshTenants = useCallback(() => api.admin.tenants().then(setTenants), []);

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

  const handleResendVerification = async (userId: string) => {
    setResending(userId);
    try {
      await api.admin.resendVerificationEmail(userId);
      alert("Təsdiq linki e-poçtuna göndərildi");
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setResending(null);
    }
  };

  const openDetailModal = async (tenantId: string) => {
    setDetailLoading(true);
    setDetailModal(null);
    try {
      const d = await api.admin.tenantDetail(tenantId);
      setDetailModal(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Məlumat yüklənə bilmədi";
      alert(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, email?: string, phone?: string) => {
    if (!email?.trim()) return;
    try {
      await api.admin.updateUser(userId, { email: email.trim(), phone: phone?.trim() });
      const d = await api.admin.tenantDetail(detailModal!.tenant.id);
      setDetailModal(d);
      setEditingUser(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("İstifadəçini silmək istədiyinizə əminsiniz?")) return;
    setDeleting(userId);
    try {
      await api.admin.deleteUser(userId);
      const d = await api.admin.tenantDetail(detailModal!.tenant.id);
      setDetailModal(d);
      refreshTenants();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteTenant = async () => {
    if (!detailModal) return;
    if (!confirm(`${detailModal.tenant.name} tenantini və bütün əlaqəli məlumatları silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.`)) return;
    setDeletingTenant(true);
    try {
      await api.admin.deleteTenant(detailModal.tenant.id);
      setDetailModal(null);
      refreshTenants();
      alert("Tenant silindi");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xəta";
      alert(msg.includes("405") ? "Server DELETE metodunu dəstəkləmir (405). Zəhmət olmasa API deploy yoxlanılsın." : msg);
    } finally {
      setDeletingTenant(false);
    }
  };

  const handleExtend = async (tenantId: string, months?: number, planId?: string) => {
    setExtending(tenantId);
    try {
      await api.admin.extendSubscription(tenantId, months ?? extendMonths, planId || extendPlanId || undefined);
      const list = await api.admin.tenants();
      setTenants(list);
      setExtendModal(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xəta baş verdi";
      alert(msg.includes("405") ? "Method Not Allowed (405) – API proxy və ya backend yoxlanılmalıdır." : msg);
    } finally {
      setExtending(null);
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    setVerifying(userId);
    try {
      await api.admin.verifyUserEmail(userId);
      await refreshTenants();
      if (detailModal) {
        const d = await api.admin.tenantDetail(detailModal.tenant.id);
        setDetailModal(d);
      }
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
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openDetailModal(t.id)}
                    className="font-medium text-primary-600 hover:underline text-left"
                  >
                    {t.name}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {(t.users ?? []).map((u) => (
                      <div key={u.id} className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-700">{u.email}</span>
                        {u.emailVerified ? (
                          <span className="text-xs text-green-600">✓</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyEmail(u.id)}
                              disabled={verifying === u.id}
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              {verifying === u.id ? "..." : "Təsdiqlə"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResendVerification(u.id)}
                              disabled={resending === u.id}
                              className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50"
                            >
                              {resending === u.id ? "..." : "Mail göndər"}
                            </button>
                          </>
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
      {(detailLoading || detailModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
            {detailLoading ? (
              <div className="h-64 animate-pulse bg-slate-100 rounded-xl" />
            ) : detailModal ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">{detailModal.tenant.name}</h3>
                  <div className="flex items-center gap-2">
                    {!detailModal.tenant.name.includes("System") && detailModal.tenant.name !== "Affiliates" && (
                      <button
                        onClick={handleDeleteTenant}
                        disabled={deletingTenant}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        {deletingTenant ? "..." : "Profili sil"}
                      </button>
                    )}
                    <button onClick={() => setDetailModal(null)} className="text-slate-500 hover:text-red-500">✕</button>
                  </div>
                </div>
                <div className="grid gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">İstifadəçilər</h4>
                    <div className="space-y-2">
                      {detailModal.users.length === 0 ? (
                        <p className="text-slate-500 text-sm py-2">Bu tenant üçün istifadəçi qeydiyyatda deyil</p>
                      ) : detailModal.users.map((u) => (
                        <div key={u.id} className="flex items-center gap-2 flex-wrap p-2 bg-slate-50 rounded-lg">
                          {editingUser?.id === u.id ? (
                            <>
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser((x) => x ? { ...x, email: e.target.value } : null)}
                                className="flex-1 min-w-[180px] px-2 py-1 border rounded"
                              />
                              <button
                                onClick={() => handleUpdateUser(u.id, editingUser.email)}
                                className="px-2 py-1 bg-primary-600 text-white rounded text-xs"
                              >
                                Saxla
                              </button>
                              <button onClick={() => setEditingUser(null)} className="px-2 py-1 border rounded text-xs">
                                Ləğv
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-slate-800">{u.email}</span>
                              {u.emailVerified ? <span className="text-green-600 text-xs">✓</span> : (
                                <>
                                  <button
                                    onClick={() => handleVerifyEmail(u.id)}
                                    disabled={verifying === u.id}
                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded"
                                  >
                                    {verifying === u.id ? "..." : "Təsdiqlə"}
                                  </button>
                                  <button
                                    onClick={() => handleResendVerification(u.id)}
                                    disabled={resending === u.id}
                                    className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded"
                                  >
                                    {resending === u.id ? "..." : "Mail göndər"}
                                  </button>
                                </>
                              )}
                              {u.role !== "SuperAdmin" && (
                                <>
                                  <button
                                    onClick={() => setEditingUser({ id: u.id, email: u.email })}
                                    className="text-xs px-2 py-0.5 text-primary-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={deleting === u.id}
                                    className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded disabled:opacity-50"
                                  >
                                    {deleting === u.id ? "..." : "Sil"}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {detailModal.subscription && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-1">Abunə</h4>
                      <p>{detailModal.subscription.name} — {detailModal.subscription.status} — bitmə: {new Date(detailModal.subscription.endDate).toLocaleDateString("az-AZ")}</p>
                      <button
                        onClick={() => { setDetailModal(null); openExtendModal({ id: detailModal.tenant.id, name: detailModal.tenant.name, contactPerson: "", createdAt: "", subscription: null }); }}
                        className="mt-1 text-primary-600 text-xs hover:underline"
                      >
                        Abunə uzat
                      </button>
                    </div>
                  )}
                  {detailModal.payments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-1">Ödənişlər (son 20)</h4>
                      <div className="max-h-32 overflow-auto space-y-1 text-xs">
                        {detailModal.payments.map((p) => (
                          <div key={p.id} className="flex justify-between">
                            <span>{p.date} — {p.amount} {p.currency}</span>
                            <span className={p.status === "Succeeded" ? "text-green-600" : "text-slate-600"}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detailModal.tickets.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-700 mb-1">Biletlər (son 10)</h4>
                      <div className="space-y-1 text-xs">
                        {detailModal.tickets.map((t) => (
                          <div key={t.id} className="flex justify-between">
                            <span>{t.subject}</span>
                            <span>{t.status} — {t.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
