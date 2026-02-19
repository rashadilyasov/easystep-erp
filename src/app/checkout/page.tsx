"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Logo from "@/components/Logo";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId");
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      const redirect = encodeURIComponent(`/checkout?planId=${planId}`);
      router.push(`/?auth=login&redirect=${redirect}`);
      return;
    }

    setStatus("redirecting");
    api
      .checkout(planId)
      .then((r) => {
        if (r?.paymentUrl) window.location.href = r.paymentUrl;
        else setError("Ödəniş linki alınmadı");
      })
      .catch((e) => {
        setError(e?.message || "Xəta baş verdi");
        setStatus("error");
      });
  }, [planId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {status === "redirecting" && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Ödəniş səhifəsinə yönləndirilir...</p>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <Link href="/pricing" className="text-primary-600 hover:underline">
                Qiymətlərə qayıt
              </Link>
            </>
          )}
          {status === "idle" && !planId && (
            <>
              <p className="text-slate-600 mb-4">Plan seçilməyib.</p>
              <Link href="/pricing" className="text-primary-600 hover:underline">
                Plan seç
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
