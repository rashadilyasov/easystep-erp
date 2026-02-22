"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const DEFAULT_DISCOUNT = 5;
const DEFAULT_COMMISSION = 5;

export default function AffiliatePromoCodesPage() {
  const [list, setList] = useState<
    { id: string; code: string; discountPercent: number; commissionPercent: number; status: string; createdAt: string; usedAt: string | null; tenantName: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ discountPercent: DEFAULT_DISCOUNT, commissionPercent: DEFAULT_COMMISSION });

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
        setCreateForm((f) => ({
          discountPercent: s.defaultDiscountPercent ?? f.discountPercent,
          commissionPercent: s.defaultCommissionPercent ?? f.commissionPercent,
        }));
      }
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.affiliate.createPromoCode({
        discountPercent: createForm.discountPercent,
        commissionPercent: createForm.commissionPercent,
      });
      setShowCreateModal(false);
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
        <h1 className="text-2xl font-bold text-slate-900">Promo kodlar</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={creating}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Yeni promo kod yarat
        </button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 mb-4">Yeni promo kod yarat</h3>
            <p className="text-sm text-slate-600 mb-4">Endirim və komissiya faizlərini təyin edin.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endirim faizi (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={createForm.discountPercent}
                  onChange={(e) => setCreateForm((f) => ({ ...f, discountPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Komissiya faizi (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={createForm.commissionPercent}
                  onChange={(e) => setCreateForm((f) => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? "Yaradılır..." : "Yarat"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      ) : list.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
          <p>Hələ promo kod yaratmayıbsınız.</p>
          <button
            onClick={() => setShowCreateModal(true)}
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
