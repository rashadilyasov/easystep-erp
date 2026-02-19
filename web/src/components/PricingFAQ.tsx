"use client";

import { useState } from "react";
import { useSiteContent, getContent } from "@/hooks/useSiteContent";

const DEFAULT_FAQ: { question: string; answer: string }[] = [
  {
    question: "Bu proqram mühasib üçünmü, yoxsa sahibkar üçün?",
    answer:
      "Easy Step ERP həm sahibkar, həm də mühasib üçün nəzərdə tutulub. Sahibkar bir baxışda maliyyə vəziyyətini görür, mühasib isə detallı uçot aparır. Hamı üçün aydın və sadə interfeys.",
  },
  {
    question: "İşçilərim ERP bilmir, öyrənə bilərlər?",
    answer:
      "Bəli. Xüsusi ERP biliyi olmayan əməkdaşlar sistemi bir neçə günə rahatlıqla istifadə edə bilər. Proqram real biznes dili ilə işləyir - „Nə qədər malım qalıb?“, „Kim mənə borcludur?“ kimi suallara cavab verir.",
  },
  {
    question: "Anbar qalıqları real vaxtda görünəcək?",
    answer:
      "Bəli. Anbar və qalıqlar hər an real vəziyyətdə görünür. Hər alış, satış və köçürmə dərhal sistemə əks olunur.",
  },
  {
    question: "Mənim işim təchizat və toptan satışdır. Uyğundur?",
    answer:
      "Bəli. Easy Step ERP təchizat və paylama şirkətləri, toptan satışla məşğul olan bizneslər üçün xüsusilə uyğundur. Alış/satış, qaimələr, borclar, kontragent idarəetməsi daxildir.",
  },
  {
    question: "Excel-dən keçmək çətin olmayacaq?",
    answer:
      "Keçid sadədir. Mövcud məlumatlarınızı Excel-dən idxal edə bilərsiniz. Hesabatlar ixraca açıqdır. Qarışıq Excel faylları və qeydlər artıq tarixdə qalır.",
  },
  {
    question: "Telefonla da işləyir?",
    answer:
      "Proqram Windows-da və serverə yüklənir. Mobil tətbiqdə hesabatlara baxmaq və sənədləri təsdiqləmək mümkündür.",
  },
  {
    question: "Ödəniş etməsəm nə olur?",
    answer:
      "Abunə müddəti bitəndə sistemə giriş dayandırılır. Məlumatlarınız saxlanılır - yenidən abunə alanda əvvəlki vəziyyətinizə qayıdarsınız.",
  },
  {
    question: "Məlumatlarım təhlükəsizdir?",
    answer:
      "Bəli. Məlumatlar OWASP ASVS standartlarına uyğun qorunur: parol siyasəti, MFA (2FA), audit loglar, imzalanmış yükləmə URL-ləri. Ödəniş məlumatları serverlərimizə gəlmir.",
  },
  {
    question: "Dəstək varmı?",
    answer:
      "Bəli. Əlaqə bölməsindən suallarınızı göndərib dəstək ala bilərsiniz. Demo təqdimatı üçün bizimlə əlaqə saxlayın.",
  },
  {
    question: "Nə vaxt nəticə görəcəyəm?",
    answer:
      "Qeydiyyat və ödənişdən sonra dərhal proqramı yükləyib işləməyə başlaya bilərsiniz. Əməkdaşlar üçün öyrənmə müddəti adətən bir neçə gün təşkil edir.",
  },
];

type FaqData = { items?: { question: string; answer: string }[] };

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { content } = useSiteContent();
  const faq = getContent<FaqData>(content, "faq", {});
  const items = Array.isArray(faq.items) && faq.items.length > 0 ? faq.items : DEFAULT_FAQ;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-medium text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <span>{item.question}</span>
            <span
              className={`shrink-0 transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {openIndex === i && (
            <div className="px-6 pb-4 pt-0 text-slate-600 border-t border-slate-100">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
