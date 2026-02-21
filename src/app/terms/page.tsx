import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "İstifadə şərtləri | Easy Step ERP",
  description: "Easy Step ERP xidmətlərindən istifadə şərtləri.",
};

export default function Terms() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">İstifadə şərtləri</h1>
          <div className="prose prose-slate max-w-none space-y-4 text-slate-600">
            <p>
              Easy Step ERP xidmətlərindən istifadə etməklə bu şərtləri qəbul etmiş olursunuz.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">1. Xidmət haqqında</h2>
            <p>
              Easy Step ERP təchizatçı şirkətləri üçün alış, satış, anbar və pul uçotu modulları təqdim edir.
              Abunə əsasında masaüstü proqrama çıxış verilir.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">2. Qeydiyyat və hesab</h2>
            <p>
              Qeydiyyat zamanı daxil etdiyiniz məlumatların düzgünlüyünə cavabdehsiniz. Şifrənizi məxfi saxlamalısınız.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">3. Ödənişlər</h2>
            <p>
              Abunə planları müddət ərzində keçərlidir. Avtomatik yeniləmə aktiv olarsa, bitmə tarixindən əvvəl növbəti dövr üçün ödəniş tutulacaq.
            </p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
