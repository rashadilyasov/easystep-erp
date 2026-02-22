"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Affiliate = {
  id: string;
  userId: string;
  email: string;
  emailVerified: boolean;
  isApproved: boolean;
  balanceTotal: number;
  balancePending: number;
  balanceBonus: number;
  createdAt: string;
  activeCustomers: number;
};

type PromoCode = {
  id: string;
  code: string;
  discountPercent: number;
  commissionPercent: number;
  status: string;
  createdAt: string;
  usedAt: string | null;
  discountValidUntil: string | null;
  affiliateEmail: string;
  tenantName: string | null;
};

type Bonus = {
  id: string;
  affiliateId: string;
  affiliateEmail: string;
  year: number;
  month: number;
  period: string;
  customerCount: number;
  bonusAmount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
};

type Commission = {
  id: string;
  amount: number;
  paymentAmount: number;
  commissionPercent: number;
  status: string;
  date: string;
  affiliateEmail: string;
  tenantName: string;
};

type Stats = {
  totalPartners: number;
  totalPending: number;
  totalPaid: number;
  pendingCount: number;
  thisMonthPaid: number;
};

export default function AdminAffiliatesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [affiliateFilter, setAffiliateFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [bonusFilter, setBonusFilter] = useState<string>("");
  const [calcBonusLoading, setCalcBonusLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoEditForm, setPromoEditForm] = useState({ discountPercent: 0, commissionPercent: 0 });
  const [promoEditSaving, setPromoEditSaving] = useState(false);

  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = { year: prevMonthDate.getFullYear(), month: prevMonthDate.getMonth() + 1 };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.admin.affiliateStats().catch(() => null),
      api.admin.affiliates(),
      api.admin.affiliateCommissions({
        status: filter || undefined,
        affiliateId: affiliateFilter || undefined,
      }),
      api.admin.affiliateBonuses({
        affiliateId: affiliateFilter || undefined,
        status: bonusFilter || undefined,
      }),
      api.admin.promoCodes({ affiliateId: affiliateFilter || undefined }),
    ])
      .then(([s, aff, com, bon, promos]) => {
        setLoadError(null);
        setStats(s ?? null);
        setList(Array.isArray(aff) ? aff : []);
        setCommissions(Array.isArray(com) ? com : []);
        setBonuses(Array.isArray(bon) ? bon ?? [] : []);
        setPromoCodes(Array.isArray(promos) ? promos ?? [] : []);
        setSelectedIds(new Set());
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "API xətası");
        setStats(null);
        setList([]);
        setCommissions([]);
        setBonuses([]);
        setPromoCodes([]);
      })
      .finally(() => setLoading(false));
  }, [filter, affiliateFilter, bonusFilter]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (editingPromo) {
      setPromoEditForm({
        discountPercent: editingPromo.discountPercent,
        commissionPercent: editingPromo.commissionPercent,
      });
    }
  }, [editingPromo]);

  const handleSavePromoEdit = async () => {
    if (!editingPromo) return;
    setPromoEditSaving(true);
    try {
      await api.admin.updatePromoCode(editingPromo.id, {
        discountPercent: promoEditForm.discountPercent,
        commissionPercent: promoEditForm.commissionPercent,
      });
      setEditingPromo(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setPromoEditSaving(false);
    }
  };

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

  const handleApproveAffiliate = async (id: string) => {
    try {
      await api.admin.approveAffiliate(id);
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handleResendVerification = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.admin.resendVerificationEmail(userId);
      alert("Təsdiq linki göndərildi");
      load();
    } catch {
      alert("E-poçt göndərilə bilmədi. SMTP ayarlarını yoxlayın.");
    }
  };

  const handleVerifyEmail = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.admin.verifyUserEmail(userId);
      alert("E-poçt təsdiqləndi");
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handleCalculateBonuses = async () => {
    setCalcBonusLoading(true);
    try {
      const r = await api.admin.calculateBonuses(prevMonth.year, prevMonth.month);
      alert(r?.message ?? "Bonus hesablandı");
      load();
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setCalcBonusLoading(false);
    }
  };

  const handleApproveBonus = async (id: string) => {
    try {
      await api.admin.approveBonus(id);
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handlePayBonus = async (id: string) => {
    try {
      await api.admin.payBonus(id);
      load();
    } catch {
      alert("Xəta baş verdi");
    }
  };

  const handleBulkApprove = async () => {
    const pending = commissions.filter((c) => c.status === "Pending" && selectedIds.has(c.id));
    if (pending.length === 0) return;
    setBulkLoading(true);
    try {
      for (const c of pending) await api.admin.approveCommission(c.id);
      load();
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkPay = async () => {
    const payables = commissions.filter(
      (c) => (c.status === "Pending" || c.status === "Approved") && selectedIds.has(c.id)
    );
    if (payables.length === 0) return;
    setBulkLoading(true);
    try {
      await api.admin.payoutBatch(payables.map((c) => c.id));
      load();
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const payables = commissions.filter((c) => c.status === "Pending" || c.status === "Approved");
    if (selectedIds.size >= payables.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(payables.map((c) => c.id)));
  };

  const copyLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/satis-partnyorlari` : "";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredList = list.filter(
    (a) => !search || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const payablesCount = commissions.filter(
    (c) => c.status === "Pending" || c.status === "Approved"
  ).length;
  const selectedPayables = commissions.filter(
    (c) => (c.status === "Pending" || c.status === "Approved") && selectedIds.has(c.id)
  ).length;
  const selectedPending = commissions.filter((c) => c.status === "Pending" && selectedIds.has(c.id)).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Satış Partnyorları</h1>

      {loadError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <p className="font-medium">Məlumat yüklənmədi</p>
          <p className="mt-1">{loadError}</p>
          <p className="mt-2 text-amber-700">Railway deploy və /api/ping yoxlayın. Təsdiq gözləyən partnyorlar üçün E-poçt təsdiqi gözləyənlər səhifəsinə baxın.</p>
          <button
            type="button"
            onClick={() => { setLoadError(null); load(); }}
            className="mt-3 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-sm font-medium"
          >
            Yenilə
          </button>
        </div>
      )}

      {/* Statistik kartlar */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Satış partnyoru sayı</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPartners}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
            <p className="text-sm text-amber-700 mb-1">Gözləyən komissiya</p>
            <p className="text-2xl font-bold text-amber-800">{stats.totalPending.toFixed(2)} ₼</p>
            <p className="text-xs text-amber-600 mt-1">{stats.pendingCount} ədəd</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm">
            <p className="text-sm text-green-700 mb-1">Bu ay ödənilən</p>
            <p className="text-2xl font-bold text-green-800">{stats.thisMonthPaid.toFixed(2)} ₼</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Ümumi ödənilən</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPaid.toFixed(2)} ₼</p>
          </div>
          <div className="bg-primary-50 rounded-xl border border-primary-200 p-4 shadow-sm">
            <p className="text-sm text-primary-700 mb-1">Qeydiyyat linki</p>
            <button
              type="button"
              onClick={copyLink}
              className="text-sm font-medium text-primary-700 hover:text-primary-800 underline"
            >
              {copied ? "Kopyalandı!" : "Linki kopyala"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Satış partnyoru siyahısı */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-slate-900">Satış partnyoru siyahısı</h2>
            <input
              type="search"
              placeholder="E-poçtla axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto text-sm border border-slate-300 rounded-lg px-3 py-1.5 w-40"
            />
          </div>
          {loading ? (
            <div className="h-40 animate-pulse bg-slate-50" />
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-medium">Hələ satış partnyoru yoxdur</p>
              <p className="text-sm mt-2">
                <a href="/satis-partnyorlari" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Qeydiyyat linki
                </a>{" "}
                vasitəsilə yeni partnyorlar qoşula bilər.
              </p>
              <p className="text-sm mt-4 text-slate-400">
                E-poçtu təsdiqlənməmiş partnyorlar{" "}
                <a href="/admin/pending-verifications" className="text-primary-600 hover:underline">E-poçt təsdiqi gözləyənlər</a> səhifəsində görünər.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt təsdiqi</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Vəziyyət</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştərilər</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Gözləyir</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ödənilən</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((a) => (
                    <tr
                      key={a.id}
                      className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${
                        affiliateFilter === a.id ? "bg-primary-50" : ""
                      }`}
                      onClick={() => setAffiliateFilter(affiliateFilter === a.id ? "" : a.id)}
                    >
                      <td className="px-6 py-3 text-sm">{a.email}</td>
                      <td className="px-6 py-3 text-sm">
                        {a.emailVerified ? (
                          <span className="text-green-600">Təsdiqlənib</span>
                        ) : (
                          <span className="text-amber-600">Təsdiq gözləyir</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {a.isApproved ? (
                          <span className="text-green-600">Təsdiqlənib</span>
                        ) : (
                          <span className="text-amber-600">Gözləyir</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm">{a.activeCustomers}</td>
                      <td className="px-6 py-3 text-sm text-amber-700">{a.balancePending.toFixed(2)} ₼</td>
                      <td className="px-6 py-3 text-sm text-green-700">{a.balanceTotal.toFixed(2)} ₼</td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        {!a.emailVerified && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleResendVerification(a.userId, e)}
                              className="text-xs px-2 py-1 mr-1 bg-slate-100 text-slate-800 rounded hover:bg-slate-200"
                            >
                              Təsdiq göndər
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleVerifyEmail(a.userId, e)}
                              className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Təsdiqlə
                            </button>
                          </>
                        )}
                        {a.emailVerified && !a.isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApproveAffiliate(a.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Təsdiqlə
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Komissiyalar */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-slate-900">Komissiyalar</h2>
              {affiliateFilter && (
                <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded">
                  {list.find((a) => a.id === affiliateFilter)?.email ?? "Filtrləndi"}{" "}
                  <button type="button" onClick={() => setAffiliateFilter("")} className="ml-1 font-bold hover:text-primary-900">×</button>
                </span>
              )}
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
            </div>
            {payablesCount > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={bulkLoading || selectedPending === 0}
                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seçilmişləri təsdiqlə ({selectedPending})
                </button>
                <button
                  type="button"
                  onClick={handleBulkPay}
                  disabled={bulkLoading || selectedPayables === 0}
                  className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seçilmişləri ödə
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="h-40 animate-pulse bg-slate-50" />
          ) : commissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="font-medium">Komissiya yoxdur</p>
              <p className="text-sm mt-2">Satış partnyorları müştəri cəlb etdikcə komissiyalar burada görünəcək.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="w-8 px-2 py-3">
                      {(filter === "Pending" || filter === "" || filter === "Approved") && (
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === payablesCount}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      )}
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Tarix</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Satış partnyoru</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştəri</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Məbləğ</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="w-8 px-2 py-3">
                        {(c.status === "Pending" || c.status === "Approved") && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        )}
                      </td>
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

      {/* Bonus idarəsi */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-900">Aylıq bonuslar (5+ müştəri)</h2>
            {affiliateFilter && (
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded">
                {list.find((a) => a.id === affiliateFilter)?.email ?? "Filtrləndi"}{" "}
                <button type="button" onClick={() => setAffiliateFilter("")} className="ml-1 font-bold hover:text-primary-900">×</button>
              </span>
            )}
            <select
              value={bonusFilter}
              onChange={(e) => setBonusFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-2 py-1"
            >
              <option value="">Hamısı</option>
              <option value="Pending">Gözləyir</option>
              <option value="Approved">Təsdiqləndi</option>
              <option value="Paid">Ödənildi</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleCalculateBonuses}
            disabled={calcBonusLoading}
            className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {calcBonusLoading ? "Hesablanır..." : `${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")} üçün hesabla`}
          </button>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-slate-50" />
        ) : bonuses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="font-medium">Bonus yoxdur</p>
            <p className="text-sm mt-2">
              Ay ərzində 5+ müştəri ödəniş edən partnyorlar üçün bonus yaradılır. &quot;Hesabla&quot; düyməsi ilə əvvəlki ay üçün hesablama edin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Dövr</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Partnyor</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştəri sayı</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Məbləğ</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Vəziyyət</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {bonuses.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm">{b.period}</td>
                    <td className="px-6 py-3 text-sm">{b.affiliateEmail}</td>
                    <td className="px-6 py-3 text-sm">{b.customerCount}</td>
                    <td className="px-6 py-3 font-medium">{b.bonusAmount.toFixed(2)} ₼</td>
                    <td className="px-6 py-3 text-sm">
                      {b.status === "Pending" && <span className="text-amber-600">Gözləyir</span>}
                      {b.status === "Approved" && <span className="text-blue-600">Təsdiqləndi</span>}
                      {b.status === "Paid" && <span className="text-green-600">Ödənildi</span>}
                    </td>
                    <td className="px-6 py-3">
                      {b.status === "Pending" && (
                        <button
                          onClick={() => handleApproveBonus(b.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 mr-1"
                        >
                          Təsdiqlə
                        </button>
                      )}
                      {(b.status === "Pending" || b.status === "Approved") && (
                        <button
                          onClick={() => handlePayBonus(b.id)}
                          className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Ödə
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promo kodlar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Promo kodlar</h2>
          {affiliateFilter && (
            <span className="text-xs text-slate-500 mt-1 block">
              Filtrləndi: {list.find((a) => a.id === affiliateFilter)?.email}
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-slate-50" />
        ) : promoCodes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Promo kod tapılmadı</div>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Kod</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Partnyor</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Müştəri</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Endirim %</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Komissiya %</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Vəziyyət</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">İstifadə</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700">Endirim bitir</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-700"></th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.slice(0, 100).map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono">{p.code}</td>
                    <td className="px-6 py-3">{p.affiliateEmail}</td>
                    <td className="px-6 py-3">{p.tenantName ?? "—"}</td>
                    <td className="px-6 py-3">{p.discountPercent}%</td>
                    <td className="px-6 py-3">{p.commissionPercent}%</td>
                    <td className="px-6 py-3">
                      <span className={p.status === "Used" ? "text-green-600" : "text-amber-600"}>{p.status === "Used" ? "İstifadə olunub" : "Aktiv"}</span>
                    </td>
                    <td className="px-6 py-3">{p.usedAt ?? "—"}</td>
                    <td className="px-6 py-3">{p.discountValidUntil ?? "—"}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => setEditingPromo(p)}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                      >
                        Dəyiş
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingPromo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingPromo(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 mb-4">Promo kod: {editingPromo.code}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endirim faizi (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={promoEditForm.discountPercent}
                  onChange={(e) => setPromoEditForm((f) => ({ ...f, discountPercent: parseFloat(e.target.value) || 0 }))}
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
                  value={promoEditForm.commissionPercent}
                  onChange={(e) => setPromoEditForm((f) => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={handleSavePromoEdit}
                disabled={promoEditSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {promoEditSaving ? "Saxlanır..." : "Saxla"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPromo(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
