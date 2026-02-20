"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Affiliate = {
  id: string;
  userId: string;
  email: string;
  balanceTotal: number;
  balancePending: number;
  createdAt: string;
  activeCustomers: number;
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [affiliateFilter, setAffiliateFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.admin.affiliateStats().catch(() => null),
      api.admin.affiliates(),
      api.admin.affiliateCommissions({
        status: filter || undefined,
        affiliateId: affiliateFilter || undefined,
      }),
    ])
      .then(([s, aff, com]) => {
        setStats(s ?? null);
        setList(aff);
        setCommissions(com);
        setSelectedIds(new Set());
      })
      .catch(() => {
        setStats(null);
        setList([]);
        setCommissions([]);
      })
      .finally(() => setLoading(false));
  }, [filter, affiliateFilter]);

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
    const url = typeof window !== "undefined" ? `${window.location.origin}/register-affiliate` : "";
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Satış ortakları</h1>

      {/* Statistik kartlar */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Satış ortağı sayı</p>
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
        {/* Satış ortağı siyahısı */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-slate-900">Satış ortağı siyahısı</h2>
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
              <p className="font-medium">Hələ satış ortağı yoxdur</p>
              <p className="text-sm mt-2">
                <a href="/register-affiliate" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Qeydiyyat linki
                </a>{" "}
                vasitəsilə yeni ortaklar qoşula bilər.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">E-poçt</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Müştərilər</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Gözləyir</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Ödənilən</th>
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
                      <td className="px-6 py-3 text-sm">{a.activeCustomers}</td>
                      <td className="px-6 py-3 text-sm text-amber-700">{a.balancePending.toFixed(2)} ₼</td>
                      <td className="px-6 py-3 text-sm text-green-700">{a.balanceTotal.toFixed(2)} ₼</td>
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
              <p className="text-sm mt-2">Satış ortakları müştəri cəlb etdikcə komissiyalar burada görünəcək.</p>
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
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Satış ortağı</th>
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
    </div>
  );
}
