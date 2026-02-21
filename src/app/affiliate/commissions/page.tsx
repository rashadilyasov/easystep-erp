"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AffiliateCommissionsPage() {
  const [list, setList] = useState<
    { id: string; amount: number; paymentAmount: number; commissionPercent: number; status: string; date: string; paidAt: string | null; tenantName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.affiliate
      .commissions()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const statusBadge = (s: string) => {
    const c = s === "Paid" ? "bg-green-100 text-green-800" : s === "Approved" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";
    const t = s === "Pending" ? "Gözləyir" : s === "Approved" ? "Təsdiqləndi" : "Ödənildi";
    return <span className={`px-2 py-1 rounded text-xs ${c}`}>{t}</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Komissiyalar</h1>

      {loading ? (
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      ) : list.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
          <p>Hələ komissiya yoxdur.</p>
          <p className="text-sm mt-2">Müştəriləriniz promo kodla abunə aldıqca komissiyalar burada görünəcək.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tarix</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştəri</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ödəniş</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Komissiya</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Vəziyyət</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ödəniş tarixi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 text-sm">{c.date}</td>
                  <td className="px-6 py-3">{c.tenantName}</td>
                  <td className="px-6 py-3">{c.paymentAmount.toFixed(2)} ₼</td>
                  <td className="px-6 py-3 font-medium">{c.amount.toFixed(2)} ₼</td>
                  <td className="px-6 py-3">{statusBadge(c.status)}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.paidAt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
