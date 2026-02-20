"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type DashboardData = {
  activeCustomers: number;
  balancePending: number;
  balanceTotal: number;
  lastMonthCommissions: { amount: number; status: string; date: string; tenantName: string }[];
  promoCodes: { id: string; code: string; discountPercent: number; commissionPercent: number; status: string }[];
};

export default function AffiliateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.affiliate
      .dashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Satış partnyoru paneli</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Aktiv müştərilər</h3>
          <p className="text-3xl font-bold text-slate-900">{data.activeCustomers}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Gözləyən balans</h3>
          <p className="text-3xl font-bold text-amber-600">{data.balancePending.toFixed(2)} ₼</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Ümumi ödənilən</h3>
          <p className="text-3xl font-bold text-green-600">{data.balanceTotal.toFixed(2)} ₼</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Promo kodlar</h3>
          <p className="text-3xl font-bold text-slate-900">{data.promoCodes.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Son komissiyalar</h3>
          {data.lastMonthCommissions.length === 0 ? (
            <p className="text-slate-500 text-sm">Hələ komissiya yoxdur</p>
          ) : (
            <div className="space-y-2">
              {data.lastMonthCommissions.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <span>{c.tenantName}</span>
                  <span className="font-medium">{c.amount.toFixed(2)} ₼</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Promo kodlar</h3>
          {data.promoCodes.length === 0 ? (
            <p className="text-slate-500 text-sm">Promo kod yoxdur</p>
          ) : (
            <div className="space-y-2">
              {data.promoCodes.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                  <code className="bg-slate-100 px-2 py-1 rounded font-mono">{p.code}</code>
                  <span className={`px-2 py-0.5 rounded text-xs ${p.status === "Used" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {p.status === "Used" ? "Istifadə olunub" : "Aktiv"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
