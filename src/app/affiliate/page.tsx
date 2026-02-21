"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type DashboardData = {
  isApproved: boolean;
  activeCustomers: number;
  thisMonthCustomerCount: number;
  bonusRequired: number;
  bonusStatus: string;
  balancePending: number;
  balanceTotal: number;
  balanceBonus?: number;
  lastMonthCommissions: { amount: number; status: string; date: string; tenantName: string }[];
  promoCodes: {
    id: string;
    code: string;
    discountPercent: number;
    commissionPercent: number;
    status: string;
    usedAt?: string | null;
    discountValidUntil?: string | null;
    tenantName?: string | null;
  }[];
};

export default function AffiliateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.affiliate
      .dashboard()
      .then((d) => {
        setData(d ?? null);
      })
      .catch((e) => {
        setData(null);
        setError(e instanceof Error ? e.message : "Məlumat yüklənmədi");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  if (loading && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel</h1>
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

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel</h1>
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
          <p className="font-medium">Məlumat yüklənmədi</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium"
          >
            Yenilə
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Satış partnyoru paneli</h1>

      {!data.isApproved && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <p className="font-medium">Qeydiyyatınız admin təsdiqi gözləyir</p>
          <p className="text-sm mt-1">Təsdiqləndikdən sonra promo kod yarada biləcəksiniz.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Aktiv müştərilər</h3>
          <p className="text-3xl font-bold text-slate-900">{data.activeCustomers}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Bu ay müştəri</h3>
          <p className="text-3xl font-bold text-slate-900">
            {data.thisMonthCustomerCount}/{data.bonusRequired ?? 5}
          </p>
          <p className="text-xs text-slate-500 mt-1"> Bonus: {data.bonusStatus === "Pending" ? "Gözləyir" : data.bonusStatus === "Approved" ? "Təsdiqləndi" : data.bonusStatus === "Paid" ? "Ödənildi" : data.bonusStatus}</p>
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
        {(data.balanceBonus ?? 0) > 0 && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Bonus balansı</h3>
            <p className="text-3xl font-bold text-primary-600">{data.balanceBonus!.toFixed(2)} ₼</p>
          </div>
        )}
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
                <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0 gap-2">
                  <code className="bg-slate-100 px-2 py-1 rounded font-mono shrink-0">{p.code}</code>
                  <div className="text-right min-w-0">
                    {p.tenantName && <p className="text-slate-600 truncate">{p.tenantName}</p>}
                    {p.discountValidUntil && (
                      <p className="text-xs text-slate-500">Endirim: {p.discountValidUntil}</p>
                    )}
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${p.status === "Used" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.status === "Used" ? "İstifadə olunub" : "Aktiv"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
