"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Payment = {
  id: string;
  date: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transactionId: string | null;
};

export default function AdminPaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .payments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Tarix</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Tenant</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Məbləğ</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Provider</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                Ödəniş tapılmadı
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{p.date}</td>
                <td className="px-4 py-3 font-medium">{p.tenantName}</td>
                <td className="px-4 py-3">{p.amount} {p.currency}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      p.status === "Succeeded"
                        ? "bg-green-100 text-green-800"
                        : p.status === "Failed" || p.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">{p.provider}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
