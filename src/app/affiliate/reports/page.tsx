"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type CommissionReportItem = {
  id: string;
  amount: number;
  paymentAmount: number;
  commissionPercent: number;
  status: string;
  date: string;
  paidAt: string | null;
  tenantName: string;
  promoCode: string;
};

type PaymentItem = {
  id: string;
  amount: number;
  date: string;
  tenantName: string;
  source: string;
};

const COMMISSION_METHOD_LABELS: Record<number, string> = {
  0: "Seçilməyib",
  1: "Bank köçürməsi",
  2: "Payriff",
  3: "Kart / Digər",
};

export default function AffiliateReportsPage() {
  const [commissions, setCommissions] = useState<CommissionReportItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [profile, setProfile] = useState<{
    commissionReceiveMethod: number;
    bankIban?: string;
    bankName?: string;
    bankAccountHolder?: string;
    payriffInfo?: string;
    commissionAccountNote?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterMonth, setFilterMonth] = useState<number | "">("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.affiliate.commissionReports({ year: filterYear || undefined, month: filterMonth || undefined, limit: 200 }),
      api.affiliate.paymentHistory(100),
      api.affiliate.profile().catch(() => null),
    ])
      .then(([com, pay, prof]) => {
        setCommissions(Array.isArray(com) ? com : []);
        setPayments(Array.isArray(pay) ? pay : []);
        setProfile(prof ? {
          commissionReceiveMethod: prof.commissionReceiveMethod ?? 0,
          bankIban: prof.bankIban,
          bankName: prof.bankName,
          bankAccountHolder: prof.bankAccountHolder,
          payriffInfo: prof.payriffInfo,
          commissionAccountNote: prof.commissionAccountNote,
        } : null);
      })
      .catch(() => {
        setCommissions([]);
        setPayments([]);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [filterYear, filterMonth]);

  useEffect(() => load(), [load]);

  const now = new Date();
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = [
    { v: 1, l: "Yanvar" }, { v: 2, l: "Fevral" }, { v: 3, l: "Mart" }, { v: 4, l: "Aprel" },
    { v: 5, l: "May" }, { v: 6, l: "İyun" }, { v: 7, l: "İyul" }, { v: 8, l: "Avqust" },
    { v: 9, l: "Sentyabr" }, { v: 10, l: "Oktyabr" }, { v: 11, l: "Noyabr" }, { v: 12, l: "Dekabr" },
  ];

  const statusBadge = (s: string) => {
    const c = s === "Paid" ? "bg-green-100 text-green-800" : s === "Approved" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";
    const t = s === "Pending" ? "Gözləyir" : s === "Approved" ? "Təsdiqləndi" : "Ödənildi";
    return <span className={`px-2 py-1 rounded text-xs ${c}`}>{t}</span>;
  };

  const getAccountSummary = () => {
    if (!profile) return null;
    const parts: string[] = [];
    if (profile.commissionReceiveMethod === 1) {
      if (profile.bankName) parts.push(profile.bankName);
      if (profile.bankAccountHolder) parts.push(profile.bankAccountHolder);
      if (profile.bankIban) {
        const iban = profile.bankIban.replace(/\s/g, "");
        parts.push(iban.length >= 4 ? `***${iban.slice(-4)}` : "***");
      }
    } else if (profile.commissionReceiveMethod === 2 && profile.payriffInfo) {
      parts.push(profile.payriffInfo);
    } else if (profile.commissionReceiveMethod === 3 && profile.commissionAccountNote) {
      parts.push(profile.commissionAccountNote);
    }
    if (profile.commissionAccountNote && profile.commissionReceiveMethod !== 3) parts.push(profile.commissionAccountNote);
    return parts.filter(Boolean).join(" • ") || null;
  };

  const accountSummary = getAccountSummary();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Hesabatlar</h1>
      <p className="text-slate-600 mb-6">Komissiya və ödəniş tarixçəniz.</p>

      {/* Komissiya hansı hesaba alınır */}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <h2 className="font-semibold text-slate-900 mb-2">Komissiya hansı hesaba ödənilir</h2>
        {profile && (
          <div className="text-sm text-slate-700">
            <p>
              <span className="font-medium">{COMMISSION_METHOD_LABELS[profile.commissionReceiveMethod] ?? "Seçilməyib"}</span>
              {accountSummary && (
                <span className="text-slate-600 ml-2">— {accountSummary}</span>
              )}
            </p>
            {profile.commissionReceiveMethod === 0 && (
              <p className="text-amber-600 mt-1">Ödəniş almaq üçün Profil və rekvizitlər səhifəsindən hesab məlumatınızı əlavə edin.</p>
            )}
            <Link href="/affiliate/profile" className="inline-block mt-2 text-primary-600 hover:text-primary-700 font-medium">
              Profil və rekvizitləri redaktə et →
            </Link>
          </div>
        )}
      </div>

      {/* Aylıq komissiya hesabatı */}
      <div className="mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">Aylıq komissiya hesabatı</h2>
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value, 10) : "")}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">Bütün illər</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value, 10) : "")}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">Bütün aylar</option>
            {months.map((m) => (
              <option key={m.v} value={m.v}>{m.l}</option>
            ))}
          </select>
          <button onClick={load} className="text-sm px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
            Yenilə
          </button>
        </div>

        {loading ? (
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Tarix</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Müştəri</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Promo kod</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Ödəniş</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Komissiya</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Vəziyyət</th>
                    <th className="text-left px-6 py-3 font-medium text-slate-700">Ödəniş tarixi</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Bu dövr üçün komissiya tapılmadı
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-3">{c.date}</td>
                        <td className="px-6 py-3">{c.tenantName}</td>
                        <td className="px-6 py-3 font-mono">{c.promoCode}</td>
                        <td className="px-6 py-3">{c.paymentAmount.toFixed(2)} ₼</td>
                        <td className="px-6 py-3 font-medium">{c.amount.toFixed(2)} ₼</td>
                        <td className="px-6 py-3">{statusBadge(c.status)}</td>
                        <td className="px-6 py-3 text-slate-600">{c.paidAt ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ödəniş tarixçəsi */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Ödəniş tarixçəsi</h2>
        <p className="text-sm text-slate-600 mb-4">Sizə ödənilmiş komissiya və bonuslar.</p>

        {loading ? (
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        ) : payments.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            Hələ ödəniş yoxdur
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Tarix</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Məbləğ</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Mənbə</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Təfərrüat</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={`${p.source}-${p.id}`} className="border-t border-slate-100">
                    <td className="px-6 py-3">{p.date}</td>
                    <td className="px-6 py-3 font-medium text-green-700">{p.amount.toFixed(2)} ₼</td>
                    <td className="px-6 py-3">
                      <span className={p.source === "Bonus" ? "bg-primary-100 text-primary-800 px-2 py-0.5 rounded text-xs" : ""}>
                        {p.source}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{p.tenantName}</td>
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
