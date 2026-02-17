"use client";

import PricingPlans from "@/components/PricingPlans";
import PricingFAQ from "@/components/PricingFAQ";
import { useSiteContent, getContent } from "@/hooks/useSiteContent";

const DEFAULT_COMPARISON = [
  "Alış-satış sifarişləri, qaimə, faktura və tranzit əməliyyatlarının idarəetməsi",
  "Anbar uçotu, real vaxt stok nəzarəti və minimum stok limitləri",
  "Müştəri əsasında fərqlənən qiymət siyahıları (PriceList)",
  "Kassa, bank və pul vəsaitlərinin vahid idarəetməsi",
  "Debitor-kreditor uçotu və borcların yaşlanma (Aging) hesabatı",
  "Ekspeditor idarəetməsi və hesablaşma hesabatları",
  "Realizasiya (konsiqnasiya) üzrə sənədlər və hesabatlar",
  "Əmək haqqı uçotu",
  "İdarəetmə və əməliyyat xərclərinin uçotu",
  "Layihə əsasında sifariş idarəetməsi və hesabatlılıq",
  "Mənfəət-zərər (P/L) və nağd pul axını (Cash Flow) hesabatları",
  "Çoxmərhələli sənəd təsdiqlənmə mexanizmi",
  "Sənəd statusu barədə avtomatik bildirişlər",
  "Mobil tətbiq vasitəsilə hesabatlara çıxış",
  "Verilənlər bazasının ehtiyat nüsxəsi və bərpası",
  "Audit jurnalı və rol əsaslı icazə idarəetməsi",
];

type PricingData = {
  title?: string;
  subtitle?: string;
  comparisonTitle?: string;
  comparisonFeatures?: string[];
  footerNote?: string;
};

export default function PricingContent() {
  const { content } = useSiteContent();
  const pricing = getContent<PricingData>(content, "pricing", {});
  const comparisonFeatures = Array.isArray(pricing.comparisonFeatures) && pricing.comparisonFeatures.length > 0
    ? pricing.comparisonFeatures
    : DEFAULT_COMPARISON;
  const title = pricing.title ?? "Böyük şirkət sistemi — kiçik və orta biznes qiyməti ilə";
  const subtitle = pricing.subtitle ?? "Aylıq əlçatan paketlərlə peşəkar idarəetmə. ERP proqramı üçün planını seç, ödəniş et və proqramı yüklə.";
  const comparisonTitle = pricing.comparisonTitle ?? "Plan müqayisəsi";
  const footerNote = pricing.footerNote ?? "Bütün planlarda tam funksionallıq mövcuddur. Müddətə görə fərqlənir.";

  return (
    <>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 text-center">{title}</h1>
          <p className="text-xl text-slate-600 mb-12 text-center max-w-2xl mx-auto">{subtitle}</p>
          <PricingPlans />
        </div>
      </section>

      <section className="py-16 px-4 border-t border-slate-200/80 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">{comparisonTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/80">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-6 py-4 font-semibold text-slate-900 border-b border-slate-200">Xüsusiyyət</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900 border-b border-slate-200">Başla</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900 border-b border-slate-200">Standart</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-900 border-b border-slate-200">İnkişaf</th>
                  <th className="text-center px-6 py-4 font-semibold text-primary-600 border-b border-slate-200">Əla</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                    <td className="px-6 py-4 text-slate-700">{feature}</td>
                    <td className="px-6 py-4 text-center text-slate-500">✓</td>
                    <td className="px-6 py-4 text-center text-slate-500">✓</td>
                    <td className="px-6 py-4 text-center text-slate-500">✓</td>
                    <td className="px-6 py-4 text-center text-primary-600 font-medium">✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-500 mt-4 text-center">{footerNote}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Tez-tez verilən suallar</h2>
          <PricingFAQ />
        </div>
      </section>
    </>
  );
}
