import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "Məxfilik | Easy Step ERP",
  description: "Easy Step ERP məxfilik siyasəti.",
};

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Məxfilik siyasəti</h1>
          <div className="prose prose-slate max-w-none space-y-4 text-slate-600">
            <p>
              Easy Step ERP məxfilikinizi qorumağa önəm verir.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">1. Toplanan məlumatlar</h2>
            <p>
              Qeydiyyat zamanı: e-poçt, şirkət adı, əlaqə şəxsi, VÖEN (opsional). Ödəniş məlumatları ödəniş provayderi tərəfindən işlənir; kart məlumatları bizim serverlərə göndərilmir.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">2. Məlumatların istifadəsi</h2>
            <p>
              Hesab idarəetməsi, texniki dəstək, bildirişlər və qanuni öhdəliklərin yerinə yetirilməsi üçün.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mt-6">3. Məlumatların qorunması</h2>
            <p>
              Şifrələmə, məhdud giriş və təhlükəsizlik praktikaları tətbiq edilir.
            </p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
