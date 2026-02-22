"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AffiliatePromoCodesPage() {
  const [list, setList] = useState<
    { id: string; code: string; discountPercent: number; commissionPercent: number; status: string; createdAt: string; usedAt: string | null; tenantName: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [defaults, setDefaults] = useState({ discountPercent: 5, commissionPercent: 5 });

  const load = useCallback(() => {
    setLoading(true);
    api.affiliate
      .promoCodes()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    api.affiliate.settings().then((s) => {
      if (s?.defaultDiscountPercent != null || s?.defaultCommissionPercent != null) {
        setDefaults({ discountPercent: s.defaultDiscountPercent ?? 5, commissionPercent: s.defaultCommissionPercent ?? 5 });
      }
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.affiliate.createPromoCode();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Promo kod yaradıla bilmədi";
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo kodlar</h1>
          <p className="text-sm text-slate-600 mt-1">Yeni kodlar Admin tərəfindən təyin olunan endirim {defaults.discountPercent}% və komissiya {defaults.commissionPercent}% ilə yaradılır.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {creating ? "Yaradılır..." : "Yeni promo kod yarat"}
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      ) : list.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
          <p>Hələ promo kod yaratmayıbsınız.</p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            İlk promo kodu yarat
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Kod</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Endirim %</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Komissiya %</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Vəziyyət</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştəri</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tarix</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-mono font-medium">{p.code}</td>
                  <td className="px-6 py-3">{p.discountPercent}%</td>
                  <td className="px-6 py-3">{p.commissionPercent}%</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${p.status === "Used" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {p.status === "Used" ? "İstifadə olunub" : "Aktiv"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{p.tenantName ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{p.usedAt ?? p.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
