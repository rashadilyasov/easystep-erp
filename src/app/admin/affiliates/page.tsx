"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminAffiliatesPage() {
  const [list, setList] = useState<
    { id: string; userId: string; email: string; balanceTotal: number; balancePending: number; createdAt: string; activeCustomers: number }[]
  >([]);
  const [commissions, setCommissions] = useState<
    { id: string; amount: number; status: string; affiliateEmail: string; tenantName: string; date: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.admin.affiliates(), api.admin.affiliateCommissions({ status: filter || undefined })])
      .then(([aff, com]) => {
        setList(aff);
        setCommissions(com);
      })
      .catch(() => {
        setList([]);
        setCommissions([]);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => load(), [load]);

  const handleApprove = async (id: string) => {
    try {
      await api.admin.approveCommission(id);
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.admin.payCommission(id);
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Affiliatlar</h1>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <h2 className="px-6 py-4 font-semibold text-slate-900 border-b border-slate-100">Affiliat siyahısı</h2>
          {loading ? (
            <div className="h-32 animate-pulse bg-slate-50" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştərilər</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Pending</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ödənilən</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-6 py-3">{a.email}</td>
                      <td className="px-6 py-3">{a.activeCustomers}</td>
                      <td className="px-6 py-3">{a.balancePending.toFixed(2)} ₼</td>
                      <td className="px-6 py-3">{a.balanceTotal.toFixed(2)} ₼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <h2 className="px-6 py-4 font-semibold text-slate-900 border-b border-slate-100 flex items-center justify-between">
            Komissiyalar
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-2 py-1"
            >
              <option value="">Hamısı</option>
              <option value="Pending">Gözləyir</option>
              <option value="Approved">Təsdiqləndi</option>
              <option value="Paid">Ödənildi</option>
            </select>
          </h2>
          {loading ? (
            <div className="h-32 animate-pulse bg-slate-50" />
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tarix</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Affiliat</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştəri</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Məbləğ</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="px-6 py-3 text-sm">{c.date}</td>
                      <td className="px-6 py-3 text-sm">{c.affiliateEmail}</td>
                      <td className="px-6 py-3 text-sm">{c.tenantName}</td>
                      <td className="px-6 py-3 font-medium">{c.amount.toFixed(2)} ₼</td>
                      <td className="px-6 py-3">
                        {c.status === "Pending" && (
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Təsdiqlə
                          </button>
                        )}
                        {(c.status === "Pending" || c.status === "Approved") && (
                          <button
                            onClick={() => handlePay(c.id)}
                            className="text-xs px-2 py-1 ml-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Ödə
                          </button>
                        )}
                        {c.status === "Paid" && <span className="text-green-600 text-xs">Ödənildi</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
