"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DashboardData = {
  plan: { name: string; endDate: string };
  daysLeft: number;
  status: string;
  autoRenew: boolean;
};

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.dashboard()
      .then(setData)
      .catch(() => setError("Məlumatları yükləmək mümkün olmadı"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-2xl">
        <p>{error ?? "Aktiv abunə tapılmadı"}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-primary-600 font-medium hover:underline"
        >
          Yenidən yoxla
        </button>
      </div>
    );
  }

  const d = data;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm card-hover">
        <h3 className="text-sm font-medium text-slate-600 mb-1">Plan</h3>
        <p className="text-2xl font-bold text-slate-900">{d.plan.name}</p>
        <p className="text-sm text-slate-500 mt-1">Bitmə: {d.plan.endDate}</p>
      </div>
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm card-hover">
        <h3 className="text-sm font-medium text-slate-600 mb-1">Qalan gün</h3>
        <p className="text-2xl font-bold text-primary-600">{d.daysLeft}</p>
        <p className="text-sm text-slate-500 mt-1">Avto-yeniləmə: {d.autoRenew ? "aktiv" : "deaktiv"}</p>
      </div>
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm card-hover">
        <h3 className="text-sm font-medium text-slate-600 mb-1">Status</h3>
        <p className="text-2xl font-bold text-green-600">{d.status}</p>
        <p className="text-sm text-slate-500 mt-1">Desktop proqram əlçatandır</p>
      </div>
    </div>
  );
}
