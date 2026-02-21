"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type PendingUser = {
  id: string;
  email: string;
  createdAt: string;
  role: string;
  tenantName: string | null;
  tenantId: string | null;
  affiliateId?: string;
};

export default function AdminPendingVerificationsPage() {
  const [list, setList] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.admin
      .pendingVerifications()
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        setList([]);
        setError(e instanceof Error ? e.message : "API xətası. /api/ping və Railway deploy-u yoxlayın.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const handleVerify = async (userId: string) => {
    setActionLoading((p) => ({ ...p, [userId]: "verify" }));
    try {
      await api.admin.verifyUserEmail(userId);
      load();
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[userId];
        return n;
      });
    }
  };

  const handleResend = async (userId: string) => {
    setActionLoading((p) => ({ ...p, [userId]: "resend" }));
    try {
      await api.admin.resendVerificationEmail(userId);
      alert("Təsdiq linki göndərildi");
      load();
    } catch {
      alert("E-poçt göndərilə bilmədi. SMTP ayarlarını yoxlayın.");
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[userId];
        return n;
      });
    }
  };

  const roleLabels: Record<string, string> = {
    Admin: "İdarəçi",
    Owner: "Sahib",
    Partner: "Partnyor",
    Affiliate: "Satış Partnyoru",
    CustomerAdmin: "Müştəri idarəçisi",
    CustomerUser: "Müştəri",
    User: "İstifadəçi",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">E-poçt təsdiqi gözləyənlər</h1>
          <p className="text-slate-600 text-sm">
            Qeydiyyatdan keçib, e-poçtu təsdiqlənməmiş bütün istifadəçilər (müştəri və partnyor). Əl ilə təsdiq və ya təsdiq linkini yenidən göndərmək mümkündür.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Yenilənir..." : "Yenilə"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <p className="font-medium">Səhifə yüklənmədi</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-amber-700">Həmçinin Şirkətlər səhifəsində müştəri şirkətlərinə baxıb istifadəçini oradan təsdiqləyə bilərsiniz.</p>
          <Link href="/admin/tenants" className="inline-block mt-2 text-amber-900 font-medium hover:underline">Şirkətlərə keç →</Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading && !list.length ? (
          <div className="h-40 animate-pulse bg-slate-50" />
        ) : list.length === 0 && !error ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">Təsdiq gözləyən istifadəçi yoxdur</p>
            <p className="text-sm mt-2">Bütün qeydiyyatlar təsdiqləndikdə siyahı boş olacaq.</p>
            <p className="text-sm mt-4 text-slate-400">
              Müştəri kimi qeydiyyat etdilərsə → <Link href="/admin/tenants" className="text-primary-600 hover:underline">Şirkətlər</Link> səhifəsində şirkətin altında görünər.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Rol</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Şirkət</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Qeydiyyat</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-medium">{u.email}</td>
                    <td className="px-6 py-3 text-sm">{roleLabels[u.role] ?? u.role}</td>
                    <td className="px-6 py-3 text-sm">{u.tenantName ?? "—"}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{u.createdAt}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerify(u.id)}
                          disabled={!!actionLoading[u.id]}
                          className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[u.id] === "verify" ? "..." : "Təsdiqlə"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResend(u.id)}
                          disabled={!!actionLoading[u.id]}
                          className="text-xs px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[u.id] === "resend" ? "..." : "Təsdiq göndər"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
