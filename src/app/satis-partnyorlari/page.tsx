"use client";

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function SatisPartnyorlariPage() {
  const { openLogin, openRegisterAffiliate } = useAuthModal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader active="partners" />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-center">
            Satış Partnyorları
          </h1>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Easy Step ERP ilə əməkdaşlıq edin, promo kodlar yaradın və müştəri cəlb etdikcə komissiya qazanın.
          </p>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">Satış Partnyoru Programı — Qaydalar və Müqavilə Şərtləri</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bu səhifə satış partnyorları üçün nəzərdə tutulub. Müştəri şərtlərindən fərqli olaraq partnyor münasibətləri, komissiya və bonus hüquqlarını müəyyən edir.
            </p>

            <div className="space-y-8 text-slate-600">
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">1. Promo Kod İstifadəsi və Komissiya Haqları</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Hər satış partnyoru öz promo kodlarını yalnız cəlb etdiyi müştərilər üçün yarada bilər. Bir kod — bir müştəri prinsipi tətbiq olunur.</li>
                  <li>• Promo kod vasitəsilə qeydiyyat olan müştəriyə 1 il müddətində endirim təmin olunur.</li>
                  <li>• Partnyorun komissiya hüququ həmin müştərinin aktiv abunə müddəti ilə məhdudlaşır.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">2. Aylıq Bonus — Minimum Müştəri Şərti</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Bonus ödənişi üçün təqvim ayı ərzində ən azı 5 fərqli müştərinin ödəniş etməsi tələb olunur.</li>
                  <li>• Müştəri sayının yoxlanması və bonus təsdiqi ayın sonunda sistem tərəfindən aparılır.</li>
                  <li>• Şərt yerinə yetirilməzsə, bonus növbəti ay üçün nəzərdə tutulmur; əvvəlki ayın nəticələri saxlanılmır.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">3. Partnyor Hesabı və Təhlükəsizlik Tələbləri</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Qeydiyyat üçün doğrulanabilir e-poçt ünvanı və minimum 12 simvoldan ibarət güclü şifrə (böyük/kiçik hərf və rəqəm) tələb olunur.</li>
                  <li>• Partnyor hesabının təhlükəsizliyini təmin etməyə və şəxsi məlumatlarının düzgünlüyünü saxlamağa öz öhdəliyini götürür.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">4. Hüquqi Müqavilə və Qaydaların Qəbulu</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Satış partnyoru qeydiyyatı zamanı <Link href="/terms" className="text-primary-600 hover:underline font-medium">Ümumi İstifadə Şərtləri</Link> və <Link href="/privacy" className="text-primary-600 hover:underline font-medium">Məxfilik Siyasətini</Link> qəbul etməklə bu proqrama daxil olur.</li>
                  <li>• Əlavə olaraq satış partnyoru kimi <strong>Satış Partnyoru Proqramı Qaydalarını</strong> (bu səhifədə təqdim olunanları) və komissiya/bonus şərtlərini qəbul etmiş sayılır.</li>
                  <li>• Bu qaydalara uyğunluq partnyorun hüquqi öhdəliyidir. Pozuntular müqavilənin pozulması kimi qiymətləndirilə bilər.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">5. Komissiya və Ödəniş — Hüquqi Aspektlər</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Komissiya yalnız müştərinin ödənişi tamamlandıqdan və təsdiqləndikdən sonra hesablanır.</li>
                  <li>• Ödənişlərin edilməsi və təsdiqi operator (Easy Step ERP) tərəfindən idarə olunur.</li>
                  <li>• Partnyor yalnız həqiqi, təsdiqlənmiş satışlar üçün komissiya və bonus hüququ qazanır. Saxta və ya sui-istifadə hallarında hüquqlar ləğv edilə bilər.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">6. Qadağan Olunmuş Fəaliyyətlər və Məsuliyyət</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Aldadıcı məlumat vermək, saxta müştəri yaratmaq, spam və ya qeyri-qanuni təbliğat aparmaq qəti qadağandır.</li>
                  <li>• Bütün partnyor fəaliyyətləri izlənir. Sui-istifadə aşkarlandıqda hesab dayandırıla və komissiya/bonus ödənişləri saxlanıla bilər.</li>
                  <li>• Bu qaydalar Azərbaycan Respublikasının mövcud qanunvericiliyinə uyğun tətbiq olunur.</li>
                </ul>
              </section>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={openRegisterAffiliate}
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
              >
                Qeydiyyat
              </button>
              <button
                type="button"
                onClick={() => openLogin("/affiliate")}
                className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all"
              >
                Daxil ol
              </button>
            </div>

            <p className="mt-6 text-center text-slate-500 text-sm">
              Artıq hesabınız var?{" "}
              <button
                type="button"
                onClick={() => openLogin("/affiliate")}
                className="text-primary-600 font-medium hover:underline"
              >
                Daxil ol
              </button>
              {" "}və ya yeni hesab üçün{" "}
              <button
                type="button"
                onClick={openRegisterAffiliate}
                className="text-primary-600 font-medium hover:underline"
              >
                Qeydiyyat
              </button>
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium">
              ← Ana səhifəyə qayıt
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
