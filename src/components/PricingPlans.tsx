"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  currency?: string;
  popular?: boolean;
};

const PLAN_NAMES: Record<number, string> = {
  1: "Başla",
  3: "Standart",
  6: "İnkişaf",
  12: "Əla",
};

export default function PricingPlans({ discountPercent }: { discountPercent?: number }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.plans()
      .then((data: unknown) => {
        const arr = Array.isArray(data) ? data as Plan[] : [];
        setPlans(arr.map((p) => {
          const duration = p.durationMonths || 1;
          return {
            id: p.id || String(duration),
            name: PLAN_NAMES[duration] || p.name || `Plan ${duration} ay`,
            durationMonths: duration,
            price: p.price ?? 0,
            popular: duration === 12,
          };
        }));
      })
      .catch(() => setError("Qiymətləri yükləmək mümkün olmadı"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-2xl">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-primary-600 font-medium hover:underline"
        >
          Yenidən yoxla
        </button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="p-8 text-center text-slate-600 bg-slate-50 rounded-2xl">
        Planlar tapılmadı
      </div>
    );
  }

  const oneMonthPrice = plans.find((x) => x.durationMonths === 1)?.price;
  const hasDiscount = discountPercent != null && discountPercent > 0;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((p) => {
        const originalPrice = p.price;
        const finalPrice = hasDiscount ? Math.round(originalPrice * (1 - discountPercent! / 100) * 100) / 100 : originalPrice;
        const perMonth = p.durationMonths > 0 ? Math.round(finalPrice / p.durationMonths) : finalPrice;
        const savings12 = p.durationMonths === 12 && oneMonthPrice != null ? Math.max(0, oneMonthPrice * 12 - p.price) : 0;
        return (
          <div
            key={p.id}
            className={`relative p-6 rounded-2xl border card-hover ${
              p.popular
                ? "border-primary-500 shadow-lg shadow-primary-500/20 bg-white ring-2 ring-primary-500/20"
                : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-full shadow-lg">
                Ən çox seçilən
              </span>
            )}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{p.name} - {p.durationMonths} ay</h3>
            <div className="mb-4">
              {hasDiscount && (
                <span className="text-lg text-slate-400 line-through block">{p.price} ₼</span>
              )}
              <span className="text-3xl font-bold text-slate-900">{finalPrice} ₼</span>
              <span className="text-slate-600"> / {p.durationMonths} ay</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">Ayda {perMonth} ₼</p>
            {savings12 > 0 && (
              <p className="text-sm text-green-600 font-medium mb-4">{savings12} ₼ əmanət</p>
            )}
            {p.durationMonths === 12 && savings12 <= 0 && <p className="text-sm text-slate-500 mb-4">-</p>}
            {p.durationMonths !== 12 && <p className="mb-4">&nbsp;</p>}
            <Link
              href={`/checkout?planId=${p.id}`}
              className={`block w-full py-3 text-center rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
                p.popular
                  ? "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
            >
              Plan seç
            </Link>
          </div>
        );
      })}
    </div>
  );
}
