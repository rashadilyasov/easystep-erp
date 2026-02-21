"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type AuditEntry = {
  id: string;
  action: string;
  actor: string;
  ipAddress: string | null;
  metadata?: string | null;
  date: string;
};

export default function AdminAuditContent() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [abuseOnly, setAbuseOnly] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.admin
      .audit({ abuseOnly })
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [abuseOnly]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={abuseOnly} onChange={(e) => setAbuseOnly(e.target.checked)} className="rounded" />
          <span className="text-sm">Yalnız sui-istifadə aşkarlamaları</span>
        </label>
        <button onClick={load} className="text-sm text-primary-600 hover:underline">
          Yenilə
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Tarix</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Actor</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Hərəkət</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Detallar</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                Audit qeyd tapılmadı
              </td>
            </tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id} className={`border-t border-slate-200 ${l.action.startsWith("AbuseSuspected") ? "bg-amber-50" : ""}`}>
                <td className="px-4 py-3">{l.date}</td>
                <td className="px-4 py-3">{l.actor}</td>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={l.metadata ?? ""}>{l.metadata ?? "-"}</td>
                <td className="px-4 py-3">{l.ipAddress ?? "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
