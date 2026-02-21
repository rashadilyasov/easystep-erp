import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "Easy Step ERP Funksiyalar - Alış-Satış, Anbar, P/L, Cash Flow, Ekspeditor",
  description:
    "Alış-satış sifarişləri, tranzit əməliyyatları, minimum stok nəzarəti, müştəri PriceList, borc aging, ekspeditor, realizasiya, əmək haqqı, layihə idarəetməsi, P/L və Cash Flow hesabatları. Milli ERP.",
};

export default function Features() {
  const features = [
    {
      title: "Alış-satış sifarişləri, qaimə, faktura və tranzit əməliyyatlarının idarəetməsi",
      desc: "Sifarişdən qaiməyə, faktura və invoice-ə qədər tam sənəd axını. Tranzit əməliyyatları ilə təchizat-satış dövriyyəsinin vahid idarəetməsi.",
    },
    {
      title: "Anbar uçotu, real vaxt stok nəzarəti və minimum stok limitləri",
      desc: "Çoxanbarlı uçot, real vaxt stok monitorinqi, minimum stok limitləri, inventarizasiya və anbarlar arası transfer.",
    },
    {
      title: "Müştəri əsasında fərqlənən qiymət siyahıları (PriceList)",
      desc: "Hər müştəri və ya müştəri qrupu üçün xüsusi qiymət siyahıları. Müştəri kateqoriyalarına görə avtomatik qiymətləndirmə.",
    },
    {
      title: "Debitor-kreditor uçotu və borcların yaşlanma (Aging) hesabatı",
      desc: "Təchizatçı və müştəri kartları, VÖEN, bank rekvizitləri. Debitor-kreditor uçotu və borcların yaşlanma hesabatı ilə borc analizi.",
    },
    {
      title: "Kassa, bank və pul vəsaitlərinin vahid idarəetməsi",
      desc: "Kassa, bank, mədaxil-məxaric, gəlir-xərc qrupları, avans mexanizmi və nağd pul axını (Cash Flow) izləməsi.",
    },
    {
      title: "Ekspeditor idarəetməsi və hesablaşma hesabatları",
      desc: "Ekspeditor kartları, konsignasiya hərəkətləri və hesablaşma sənədləri. Ətraflı ekspeditor hesabatları.",
    },
    {
      title: "Realizasiya (konsiqnasiya) üzrə sənədlər və hesabatlar",
      desc: "Realizasiya ilə işləyən şirkətlər üçün hesablaşma sənədləri, hesabatlar və əməliyyat tarixçəsi.",
    },
    {
      title: "Əmək haqqı uçotu",
      desc: "İşçi kartları, şöbələr, əmək haqqı hesablanması və əlaqəli hesabatlar.",
    },
    {
      title: "İdarəetmə və əməliyyat xərclərinin uçotu",
      desc: "İdarəetmə xərcləri və digər əməliyyat xərclərinin (ofis, kommunal, loqistika və s.) uçotu və analizi.",
    },
    {
      title: "Layihə əsasında sifariş idarəetməsi və hesabatlılıq",
      desc: "Layihə əsasında sifarişlərin idarə olunması, layihə-əməliyyat əlaqəsi və hesabatlılıq.",
    },
    {
      title: "Mənfəət-zərər (P/L) və nağd pul axını (Cash Flow) hesabatları",
      desc: "Mənfəət-zərər (P/L), nağd pul axını (Cash Flow), stok qalığı, borclu-borcsuz, gəlir-xərc analizi.",
    },
    {
      title: "Çoxmərhələli sənəd təsdiqlənmə mexanizmi və təhlükəsizlik",
      desc: "Qaimə, faktura və invoice-lərin çoxmərhələli təsdiqlənməsi. Verilənlər bazasının ehtiyat nüsxəsi və bərpası. Audit jurnalı və rol əsaslı icazə idarəetməsi.",
    },
    {
      title: "Panel və əsas göstəricilər",
      desc: "Bir baxışda əsas KPI-lər: stok vəziyyəti, borc balansı, nağd vəziyyəti, satış göstəriciləri. Real vaxt ümumiləşdirilmiş panel.",
    },
    {
      title: "Excel ixrac və məlumat idxalı",
      desc: "Hesabatların və cədvəllərin Excel/CSV formatında ixracı. Məhsul, kontragent və əməliyyatların kütləvi idxalı.",
    },
    {
      title: "Mobil tətbiq, hesabat çıxışı və bildirişlər",
      desc: "Mobil tətbiq vasitəsilə hesabatlara çıxış. Sənədlərin mobil üzərindən təsdiqlənməsi. Sənəd vəziyyəti barədə avtomatik bildirişlər.",
    },
  ];

  return (
    <div className="min-h-screen">
      <PublicHeader active="features" />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Funksiyalar</h1>
          <p className="text-xl text-slate-600 mb-12">
            Anbar uçotu proqramı kimi real qalıqlar, aydın ödənişlər, təchizat və borc nəzarəti - təchizatçı şirkətləri üçün.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 text-primary-600 text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                  {(i + 1).toString().padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
