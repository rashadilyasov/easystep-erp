"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

type BillingData = {
  plan: { name: string; price: number; currency: string; endDate: string } | null;
  autoRenew: boolean;
  promoCode?: { code: string; discountPercent: number } | null;
  payments: { id: string; date: string; amount: number; discountAmount?: number; currency: string; status: string; trxId: string | null; invoiceNumber?: string | null }[];
};

export default function BillingContent() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    api
      .billing()
      .then((res) => {
        setData(res ?? { plan: null, autoRenew: false, promoCode: null, payments: [] });
      })
      .catch((e) => {
        setData(null);
        const msg = e instanceof Error ? e.message : "Məlumatları yükləmək mümkün olmadı";
        setLoadError(msg.includes("401") || msg.includes("Unauthorized")
          ? "Oturum sona çatmışdır. Çıxış edib yenidən daxil olun."
          : msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const d: BillingData = data ?? {
    plan: null,
    autoRenew: false,
    promoCode: null,
    payments: [],
  };

  const handleAutoRenewChange = useCallback(
    async (checked: boolean) => {
      try {
        await api.setAutoRenew(checked);
        setData((prev) => (prev ? { ...prev, autoRenew: checked } : null));
      } catch {
        alert("Xəta baş verdi");
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {d.promoCode && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-2xl">
          <h3 className="font-semibold text-green-900 mb-2">Promo kod</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-green-800">
            <span><strong>Kod:</strong> {d.promoCode.code}</span>
            <span><strong>Endirim:</strong> {d.promoCode.discountPercent}%</span>
            {d.plan?.endDate && (
              <span><strong>Növbəti ödəniş:</strong> {new Date(d.plan.endDate).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}</span>
            )}
          </div>
        </div>
      )}
      {loadError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-2 text-amber-700 font-medium hover:underline"
          >
            Yenidən yoxla
          </button>
        </div>
      )}
      <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Cari plan</h3>
          <Link
            href="/pricing"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Planı dəyiş
          </Link>
        </div>
        {d.plan ? (
          <>
            <p className="text-slate-600">
              {d.plan.name} - {d.plan.price} ₼
              {d.promoCode && (
                <span className="ml-2 text-green-600 text-sm">
                  ({d.promoCode.discountPercent}% endirim tətbiq olunur)
                </span>
              )}
            </p>
            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={d.autoRenew}
                onChange={(e) => handleAutoRenewChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-slate-600">Avtomatik yeniləmə</span>
            </label>
          </>
        ) : (
          <p className="text-slate-600">Aktiv plan yoxdur</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Ödəniş tarixçəsi</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Tarix</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Məbləğ</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Trx ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {d.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Ödəniş tarixçəsi boşdur
                  </td>
                </tr>
              ) : (
                d.payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{p.date}</td>
                    <td className="px-4 py-3">
                      {p.amount} {p.currency === "AZN" ? "₼" : p.currency}
                      {p.discountAmount != null && p.discountAmount > 0 && (
                        <span className="block text-xs text-green-600">−{p.discountAmount} ₼ endirim</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          p.status === "Succeeded" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status === "Succeeded" ? "Təsdiqləndi" : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.trxId ?? "-"}</td>
                    <td className="px-4 py-3">
                      {p.status === "Succeeded" ? (
                        <a
                          href={api.receiptUrl(p.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Çek
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Fakturalar / Çeklər</h3>
        <p className="text-slate-600 text-sm">
          Təsdiqlənmiş ödənişlər üçün «Çek» linkinə klikləyərək çeki açıb çap edə və ya PDF olaraq saxlayabilərsiniz.
        </p>
      </div>
    </>
  );
}
