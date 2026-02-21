"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    api.admin
      .pendingVerifications()
      .then(setList)
      .catch(() => setList([]))
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
    Admin: "Admin",
    Owner: "Sahib",
    Partner: "Partnyor",
    User: "İstifadəçi",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">E-poçt təsdiqi gözləyənlər</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Qeydiyyatdan keçib, lakin e-poçtu təsdiqlənməmiş bütün istifadəçilər. Manual təsdiq və ya təsdiq linkini yenidən göndərmək mümkündür.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-40 animate-pulse bg-slate-50" />
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-medium">Təsdiq gözləyən istifadəçi yoxdur</p>
            <p className="text-sm mt-2">Bütün qeydiyyatlar təsdiqləndikdə siyahı boş olacaq.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Rol</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tenant</th>
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
