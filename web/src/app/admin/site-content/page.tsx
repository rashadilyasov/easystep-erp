"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const CONTENT_KEYS = [
  { key: "pricing", label: "Qiymətlər səhifəsi", description: "Başlıq, alt başlıq, plan müqayisəsi xüsusiyyətləri, footer mətni" },
  { key: "features", label: "Funksiyalar səhifəsi", description: "Başlıq, açıqlama, funksiya kartları (başlıq və təsvir)" },
  { key: "faq", label: "Tez-tez verilən suallar (FAQ)", description: "Sual-cavab cütlükləri" },
  { key: "home", label: "Ana səhifə", description: "Hero, hədəf auditoriya, funksional üstünlüklər və digər bölmələr" },
] as const;

const DEFAULT_CONTENT: Record<string, unknown> = {
  pricing: {
    title: "Böyük şirkət sistemi — kiçik və orta biznes qiyməti ilə",
    subtitle: "Aylıq əlçatan paketlərlə peşəkar idarəetmə. ERP proqramı üçün planını seç, ödəniş et və proqramı yüklə.",
    comparisonFeatures: [
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
    ],
    footerNote: "Bütün planlarda tam funksionallıq mövcuddur. Müddətə görə fərqlənir.",
    comparisonTitle: "Plan müqayisəsi",
  },
  features: {
    title: "Funksiyalar",
    intro: "Anbar uçotu proqramı kimi real qalıqlar, aydın ödənişlər, təchizat və borc nəzarəti — təchizatçı şirkətləri üçün.",
    features: [
      { title: "Alış-satış sifarişləri, qaimə, faktura və tranzit əməliyyatlarının idarəetməsi", desc: "Sifarişdən qaiməyə, faktura və invoice-ə qədər tam sənəd axını. Tranzit əməliyyatları ilə təchizat-satış dövriyyəsinin vahid idarəetməsi." },
      { title: "Anbar uçotu, real vaxt stok nəzarəti və minimum stok limitləri", desc: "Çoxanbarlı uçot, real vaxt stok monitorinqi, minimum stok limitləri, inventarizasiya və anbarlar arası transfer." },
    ],
  },
  faq: {
    items: [
      { question: "Bu proqram mühasib üçünmü, yoxsa sahibkar üçün?", answer: "Easy Step ERP həm sahibkar, həm də mühasib üçün nəzərdə tutulub. Sahibkar bir baxışda maliyyə vəziyyətini görür, mühasib isə detallı uçot aparır. Hamı üçün aydın və sadə interfeys." },
      { question: "İşçilərim ERP bilmir, öyrənə bilərlər?", answer: "Bəli. Xüsusi ERP biliyi olmayan əməkdaşlar sistemi bir neçə günə rahatlıqla istifadə edə bilər. Proqram real biznes dili ilə işləyir." },
      { question: "Anbar qalıqları real vaxtda görünəcək?", answer: "Bəli. Anbar və qalıqlar hər an real vəziyyətdə görünür. Hər alış, satış və köçürmə dərhal sistemə əks olunur." },
      { question: "Mənim işim təchizat və toptan satışdır. Uyğundur?", answer: "Bəli. Easy Step ERP təchizat və paylama şirkətləri üçün xüsusilə uyğundur." },
      { question: "Excel-dən keçmək çətin olmayacaq?", answer: "Keçid sadədir. Mövcud məlumatlarınızı Excel-dən idxal edə bilərsiniz." },
      { question: "Telefonla da işləyir?", answer: "Proqram veb brauzerdə işləyir. Kompüter və planşetdə tam funksiyalı. Telefonda isə sadəcə sənədləri təsdiqləmə və hesabata baxmaq mümkündür." },
      { question: "Ödəniş etməsəm nə olur?", answer: "Abunə müddəti bitəndə sistemə giriş dayandırılır. Məlumatlarınız saxlanılır." },
      { question: "Məlumatlarım təhlükəsizdir?", answer: "Bəli. Məlumatlar OWASP ASVS standartlarına uyğun qorunur." },
      { question: "Dəstək varmı?", answer: "Bəli. Əlaqə bölməsindən dəstək ala bilərsiniz." },
      { question: "Nə vaxt nəticə görəcəyəm?", answer: "Qeydiyyat və ödənişdən sonra dərhal proqramı yükləyib işləməyə başlaya bilərsiniz." },
    ],
  },
  home: {
    hero: { h1: "İşi etibarlı insanlara, nəticəni sistemə həvalə edin", subtitle: "Peşəkar idarəetmə — sadə interfeys. Real vaxtda nəzarət." },
    targetTitle: "Easy Step ERP kimlər üçündür?",
    targetItems: [
      { title: "Təchizat və paylama", desc: "Distribütorlar, təchizatçılar", icon: "📦" },
      { title: "Toptan satış", desc: "Wholesale bizneslər", icon: "🏪" },
    ],
    benefitsTitle: "Funksional üstünlüklər",
    benefitsItems: [
      { icon: "📦", title: "Anbar və qalıqlar", desc: "Hər an real vəziyyət — stok nəzarəti", gradient: "from-blue-50 to-white" },
    ],
  },
};

export default function SiteContentPage() {
  const [items, setItems] = useState<{ key: string; value: string; updatedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.admin.siteContent
      .list()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getValue = (key: string) => {
    const found = items.find((i) => i.key === key);
    if (found) {
      try {
        return JSON.stringify(JSON.parse(found.value), null, 2);
      } catch {
        return found.value;
      }
    }
    const def = DEFAULT_CONTENT[key as keyof typeof DEFAULT_CONTENT];
    return def ? JSON.stringify(def, null, 2) : "{}";
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(getValue(key));
    setError(null);
  };

  const save = async () => {
    if (!editingKey) return;
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(editValue);
      await api.admin.siteContent.upsert(editingKey, parsed);
      setEditingKey(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON xətası. Yoxlayın ki, format düzgündür.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    const def = DEFAULT_CONTENT[editingKey as keyof typeof DEFAULT_CONTENT];
    if (def) setEditValue(JSON.stringify(def, null, 2));
    setError(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Səhifə kontenti</h1>
      <p className="text-slate-600 text-sm mb-6">
        Bütün ictimai səhifələrin (Ana səhifə, Qiymətlər, Funksiyalar, FAQ) mətnlərini buradan dəyişə bilərsiniz.
      </p>

      {loading ? (
        <div className="space-y-4">
          {CONTENT_KEYS.map(({ key }) => (
            <div key={key} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {CONTENT_KEYS.map(({ key, label, description }) => (
            <div key={key} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
              <p className="text-sm text-slate-500 mb-4">{description}</p>
              {editingKey === key ? (
                <div>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-64 p-4 font-mono text-sm border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    spellCheck={false}
                  />
                  {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? "Saxlanılır..." : "Yadda saxla"}
                    </button>
                    <button
                      onClick={resetToDefault}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Varsayılana qaytar
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Ləğv et
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(key)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Redaktə et
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
