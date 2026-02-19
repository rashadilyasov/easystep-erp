import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import HeroErpVisual from "@/components/HeroErpVisual";

export const metadata = {
  title: "Easy Step ERP - Anbar, Satış və Təchizat İdarəetməsi",
  description:
    "Təchizat, toptan və pərakəndə satış üçün sadə ERP proqramı. Anbar qalıqları, kassa, borclar və hesabatlar - \"adam dili\" ilə.",
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="pt-24 pb-24 sm:pb-20 px-3 sm:px-6 lg:px-8 overflow-visible bg-gradient-to-b from-white via-slate-50/30 to-white">
        <div className="max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight text-center animate-fade-in-up opacity-0 [animation-fill-mode:forwards] pt-1 overflow-visible">
            İşi etibarlı insanlara, nəticəni sistemə həvalə edin
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-6 max-w-2xl mx-auto text-center animate-fade-in-up opacity-0 [animation-delay:0.08s] [animation-fill-mode:forwards]">
            Peşəkar idarəetmə - sadə interfeys. Real vaxtda nəzarət.
          </p>
          <HeroErpVisual />
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 [animation-delay:0.15s] [animation-fill-mode:forwards]">
            <Link href="/pricing" className="btn-primary text-lg px-8 py-4">
              Qiymətlərə bax
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              Demo istə
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-primary-50/20 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/30 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Peşəkar maliyyə yanaşması - hamı üçün əlçatan
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              İllərlə formalaşmış təcrübə sadə və anlaşılan formaya gətirildi.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "✗", title: "Mürəkkəb terminlər yox", desc: "Sadə, aydın dil", color: "border-emerald-200 bg-emerald-50/50" },
              { icon: "✗", title: "Qarışıq hesabatlar yox", desc: "Bir baxışda başa düşün", color: "border-emerald-200 bg-emerald-50/50" },
              { icon: "✗", title: "Mütəxəssis məcburiyyəti yox", desc: "Hər kəs istifadə edə bilər", color: "border-emerald-200 bg-emerald-50/50" },
            ].map((item) => (
              <div key={item.title} className={`p-6 rounded-2xl border-2 ${item.color} text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <div className="text-2xl font-bold text-red-500 mb-2">{item.icon}</div>
                <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 text-white text-center shadow-xl shadow-primary-500/30">
            <p className="text-xl font-bold">
              Sizin maliyyə baxışınız, artıq proqramın içində hazırdır.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Easy Step ERP kimlər üçündür?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { title: "Təchizat və paylama", desc: "Distribütorlar, təchizatçılar", icon: "📦" },
              { title: "Toptan satış", desc: "Wholesale bizneslər", icon: "🏪" },
              { title: "Pərakəndə şəbəkələr", desc: "Mağazalar, filiallar", icon: "🛒" },
              { title: "Anbarı olan sahibkarlar", desc: "Stok idarəetməsi", icon: "📋" },
              { title: "Böyüyən şirkətlər", desc: "Nəzarət itirməyin", icon: "📈" },
              { title: "Önün görmək istəyən sahibkarlar", desc: "Vəziyyəti bilmək - aydın qərar vermək", icon: "👁️" },
            ].map((item) => (
              <div key={item.title} className="group p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-md hover:shadow-xl hover:border-primary-200 transition-all duration-300 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-primary-50/30 border border-slate-200 text-center">
            <p className="text-slate-700 font-medium">
              Xüsusi ERP biliyi olmayan əməkdaşlar sistemi <span className="text-primary-600 font-bold">bir neçə günə</span> rahatlıqla mənimsəyir.
            </p>
          </div>
        </div>
      </section>

      {/* Adam dili */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Proqram sizinlə real biznes dili ilə danışır
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { q: "Nə qədər malım qalıb?", label: "Anbar" },
              { q: "Kim mənə borcludur?", label: "Debitor" },
              { q: "Bu ay qazancım varmı?", label: "Mənfəət" },
            ].map((item) => (
              <div key={item.q} className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">{item.label}</div>
                <p className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">„{item.q}"</p>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-lg">
            Maliyyəçi olmağa ehtiyac yoxdur - <span className="font-bold text-slate-800">sadəcə baxırsınız və anlayırsınız.</span>
          </p>
        </div>
      </section>

      {/* Functional Benefits */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Funksional üstünlüklər
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "📦", title: "Anbar və qalıqlar", desc: "Hər an real vəziyyət - stok nəzarəti", gradient: "from-blue-50 to-white" },
              { icon: "💵", title: "Kassa və ödənişlər", desc: "Nə gəldi, nə çıxdı - aydın balans", gradient: "from-emerald-50 to-white" },
              { icon: "📋", title: "Təchizat və borclar", desc: "Kimə nə qədər borc - bir səhifədə", gradient: "from-amber-50 to-white" },
              { icon: "📊", title: "Sadə hesabatlar", desc: "Bir baxışda vəziyyət - qərar dəstəyi", gradient: "from-primary-50 to-white" },
              { icon: "🛡️", title: "Nəzarət və tarixçə", desc: "Hər əməliyyat iz buraxır - etibarlılıq", gradient: "from-slate-50 to-white" },
              { icon: "🔐", title: "İstifadəçi icazələri", desc: "Kim nə görür - rollar və hədlər ilə nəzarət", gradient: "from-violet-50 to-white" },
            ].map((item) => (
              <div key={item.title} className={`p-6 rounded-2xl border border-slate-200 bg-gradient-to-br ${item.gradient} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-center">
            <p className="text-slate-600 font-medium italic">
              Qarışıq Excel faylları və qeydlər - tarixdə qalır.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Psychology */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Böyük şirkət sistemi - kiçik biznes qiyməti ilə
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Peşəkar maliyyə idarəetməsi adətən bahalıdır. Easy Step ERP isə aylıq əlçatan paketlərlə - ayrıca mütəxəssis saxlamadan sistemi əldə edirsiniz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/pricing" className="btn-primary text-lg px-10 py-4 shadow-xl shadow-primary-500/30">
              Qiymətlərə bax
            </Link>
            <Link href="/contact" className="text-primary-600 font-semibold hover:underline">
              Və ya pulsuz demo istəyin →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 bg-white">
            <div className="p-12 md:p-16 text-center bg-gradient-to-br from-slate-50 to-white">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-100 text-primary-600 text-4xl mb-6">
                ✓
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
                Praktikadan gələn sistem
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Easy Step ERP real biznes prosesləri əsasında qurulmuş <span className="font-bold text-primary-600">milli ERP sistemidir</span>. Kağız üzərində nəzəriyyə deyil - real işin içindən çıxmış yanaşmadır.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {["Real təcrübə", "Milli həll", "Etibarlı"].map((badge) => (
                  <span key={badge} className="px-5 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Hazırsınız?</h2>
          <p className="text-xl text-primary-100 mb-10">
            Plan seçin, ödəyin və proqramı dərhal yükləyin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-primary-600 bg-white shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1">
              Qiymətlərə bax
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-white border-2 border-white/80 hover:bg-white/10 transition-all">
              Demo istə
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
