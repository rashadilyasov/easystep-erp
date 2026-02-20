"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const FALLBACK_STATS = {
  totalTenants: 0,
  activeSubscriptions: 0,
  revenueThisMonth: 0,
  openTickets: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<typeof FALLBACK_STATS>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErrorMsg(null);
    api.admin
      .stats()
      .then((data) => {
        setStats({
          totalTenants: data?.totalTenants ?? 0,
          activeSubscriptions: data?.activeSubscriptions ?? 0,
          revenueThisMonth: data?.revenueThisMonth ?? 0,
          openTickets: data?.openTickets ?? 0,
        });
        setApiOk(true);
      })
      .catch((e) => {
        setStats(FALLBACK_STATS);
        setApiOk(false);
        const msg = e instanceof Error ? e.message : "Naməlum xəta";
        setErrorMsg(msg);
        if (typeof console !== "undefined" && console.error) console.error("[Admin stats]", e);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>

      {!apiOk && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-amber-800">
              API ilə əlaqə yoxdur. Statistikalar 0 göstərilir.{" "}
              {typeof window !== "undefined" && !window.location.hostname.includes("easysteperp.com")
                ? "api qovluğunda dotnet run ilə serveri işə salın."
                : "API_URL və Railway konfiqurasiyasını yoxlayın."}
            </p>
            {errorMsg && <p className="text-xs text-amber-700 mt-2 font-mono break-all">{errorMsg}</p>}
            <a
              href="/api/ping"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-primary-600 hover:underline"
            >
              API əlaqəsini yoxla →
            </a>
          </div>
          <button onClick={load} className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
            Yenilə
          </button>
        </div>
      )}

      {loading && apiOk ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Tenantlar</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.totalTenants}</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Aktiv abunələr</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Bu ay gəlir</h3>
            <p className="text-3xl font-bold text-slate-900">
              {stats.revenueThisMonth.toLocaleString("az-AZ")} ₼
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600 mb-1">Açıq biletlər</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.openTickets}</p>
          </div>
        </div>
      )}
    </div>
  );
}
