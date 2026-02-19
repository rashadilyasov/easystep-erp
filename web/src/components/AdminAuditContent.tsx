"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type AuditEntry = {
  id: string;
  action: string;
  actor: string;
  ipAddress: string | null;
  date: string;
};

export default function AdminAuditContent() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .audit()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Tarix</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Actor</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Hərəkət</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                Audit qeyd tapılmadı
              </td>
            </tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{l.date}</td>
                <td className="px-4 py-3">{l.actor}</td>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3">{l.ipAddress ?? "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
