import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata = {
  title: "Easy Step ERP Təhlükəsizlik - Nəzarət, Tarixçə, İcazələr",
  description:
    "İstifadəçi rolları, əməliyyat tarixçəsi və təhlükəsizlik yanaşması ilə məlumatlarınız nəzarətdə.",
};

export default function Security() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Təhlükəsizlik</h1>
          <p className="text-xl text-slate-600 mb-12">
            Təchizatçı məlumatlarınız OWASP ASVS standartlarına uyğun qorunur.
          </p>
          <ul className="space-y-4 text-slate-700">
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">•</span>
              Parol siyasəti: minimum 12 simvol, bcrypt/argon2 hash
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">•</span>
              MFA (2FA): adminlər üçün məcburi, müştərilər üçün tövsiyə olunur
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">•</span>
              Ödəniş: kart məlumatları serverlərimizə gəlmir (hosted checkout)
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">•</span>
              Audit loglar: append-only, dəyişdirilə bilməz
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 font-bold">•</span>
              Yükləmə: imzalanmış, vaxt məhdud URL-lər
            </li>
          </ul>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
