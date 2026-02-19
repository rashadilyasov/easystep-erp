"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setError("Daxil olmalısınız");
      return;
    }
    const base = getApiBase();
    fetch(`${base}/api/billing/receipt/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Çek tapılmadı");
        return r.text();
      })
      .then(setHtml)
      .catch((e) => setError(e instanceof Error ? e.message : "Xəta"));
  }, [paymentId]);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-primary-600 hover:underline">
          ← Geri
        </button>
      </div>
    );
  }

  if (!html) {
    return <div className="p-8 animate-pulse">Yüklənir...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Çap et / PDF saxla
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          ← Geri
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
