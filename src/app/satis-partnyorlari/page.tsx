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
              Bu sənəd yalnız satış partnyorları üçündür. Müştəri İstifadə Şərtlərindən və Məxfilik Siyasətindən fərqli olaraq partnyor-agent münasibətlərini, komissiya və bonus hüquqlarını, eləcə də öhdəlikləri müəyyən edir.
            </p>

            <div className="space-y-8 text-slate-600 text-[15px] leading-relaxed">
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">1. Təriflər və Proqrama Qoşulma Şərtləri</h3>
                <p className="mb-3">Bu Qaydalar üzrə:</p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li><strong>Satış Partnyoru</strong> — Easy Step ERP proqramını təbliğ edən və müştəri cəlb etmək üçün promo kodlardan istifadə edən fiziki və ya hüquqi şəxs.</li>
                  <li><strong>Operator</strong> — Easy Step ERP xidmətlərini təqdim edən tərəf.</li>
                  <li><strong>Müştəri</strong> — Partnyorun promo kodu vasitəsilə qeydiyyatdan keçərək abunə olan şəxs.</li>
                </ul>
                <p className="mt-3">Proqrama qoşulmaq üçün partnyor əvvəlcə <Link href="/terms" className="text-primary-600 hover:underline font-medium">Ümumi İstifadə Şərtləri</Link> və <Link href="/privacy" className="text-primary-600 hover:underline font-medium">Məxfilik Siyasətini</Link> qəbul etməlidir. Bu Qaydalar əlavə olaraq partnyor münasibətlərinə aid bütün şərtləri əhatə edir və qeydiyyatda iştirak partnyorun bu Qaydaları tam olaraq qəbul etdiyi mənasını verir.</p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">2. Promo Kodlar, Komissiya Haqları və Müddətlər</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Hər satış partnyoru yalnız öz təşəbbüsü ilə cəlb etdiyi müştərilər üçün promo kod yarada bilər. <strong>Bir kod — bir müştəri</strong> prinsipi tətbiq olunur.</li>
                  <li>Promo kod vasitəsilə qeydiyyat olan müştəriyə Operator tərəfindən 1 (bir) il müddətinə endirim təmin olunur.</li>
                  <li>Partnyorun komissiya hüququ yalnız həmin müştərinin aktiv abunə müddəti ilə məhdudlaşır.</li>
                  <li>Komissiya yalnız müştərinin ödənişi tamamlandıqdan və Operator tərəfindən təsdiqləndikdən sonra hesablanır.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">3. Aylıq Bonus — Minimum Müştəri Şərti</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Bonus ödənişi üçün təqvim ayı ərzində ən azı <strong>5 (beş)</strong> fərqli müştərinin ödəniş etməsi tələb olunur.</li>
                  <li>Müştəri sayının yoxlanması və bonusun hesablanması ayın sonunda Operator tərəfindən avtomatik sistem vasitəsilə aparılır.</li>
                  <li>Şərt yerinə yetirilməzsə, həmin ay üçün bonus nəzərdə tutulmur; əvvəlki ayların nəticələri növbəti aya keçirilmir.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">4. Partnyor Hesabı, Təhlükəsizlik və Məlumatların Düzgünlüyü</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Qeydiyyat üçün doğrulanabilir e-poçt ünvanı və minimum 12 simvoldan ibarət güclü şifrə (böyük hərf, kiçik hərf və rəqəm daxil olmaqla) tələb olunur.</li>
                  <li>Partnyor hesabının təhlükəsizliyini təmin etməyə və qeydiyyatda verilən şəxsi məlumatların düzgünlüyünü saxlamağa öz öhdəliyini götürür.</li>
                  <li>Məlumatların saxtalaşdırılması və ya yanlış təqdim edilməsi müqavilənin pozulması sayılır.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">5. Komissiya və Bonus Ödənişi — Hüquqi Aspektlər</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Ödənişlərin vaxtı, üsulu və məbləği Operator tərəfindən müəyyən edilir və partnyora əvvəlcədən bildirilir.</li>
                  <li>Partnyor yalnız həqiqi, Operator tərəfindən təsdiqlənmiş satışlar üçün komissiya və bonus hüququ qazanır.</li>
                  <li>Saxta satış, sui-istifadə və ya bu Qaydaların pozulması halında komissiya və bonus hüquqları ləğv edilə bilər; ödənilmiş məbləğlər geri tələb oluna bilər.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">6. Qadağan Olunmuş Fəaliyyətlər</h3>
                <p className="mb-2">Aşağıdakı fəaliyyətlər qəti qadağandır:</p>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Aldadıcı və ya saxta məlumat vermək; saxta müştəri hesabları yaratmaq.</li>
                  <li>Spam, qeyri-qanuni təbliğat və ya müştərilərin razılığı olmadan məlumat toplamaq.</li>
                  <li>Operatorun marka, loqo və ya adını qeyri-müəyyən edilmiş şəkildə istifadə etmək.</li>
                  <li>Özünü Operator və ya rəsmi nümayəndə kimi təqdim etmək.</li>
                </ul>
                <p className="mt-3">Bütün partnyor fəaliyyətləri audit üçün izlənir. Sui-istifadə aşkarlandıqda hesab dayandırıla, komissiya/bonus ödənişləri saxlanıla bilər.</p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">7. Müqavilənin Xitamı və Məsuliyyət</h3>
                <ul className="space-y-2 pl-4 list-disc">
                  <li>Operator istənilən vaxt, əvvəlcədən bildirməklə və ya bildirmədən bu Qaydaları dəyişdirmək və ya Proqramı dayandırmaq hüququnu saxlayır.</li>
                  <li>Qaydaların pozulması müqavilənin pozulması sayılır; Operator hesabı dayandırmaq, komissiya ödənişlərini ləğv etmək və qanuni addımlar atmaq hüququna malikdir.</li>
                  <li>Bu Qaydalar Azərbaycan Respublikasının Mülki Məcəlləsi və digər müvafiq qanunvericiliyinə uyğun şəkildə tətbiq olunur. Mübahisələr əvvəlcə sülh yolu ilə həll edilməyə çalışılır.</li>
                </ul>
              </section>

              <section className="pt-4 border-t border-slate-200">
                <p className="text-slate-500 text-sm">
                  Son yeniləmə: {new Date().toLocaleDateString("az-AZ", { year: "numeric", month: "long", day: "numeric" })}. Bu Qaydalara qoşulmaqla partnyor bütün şərtləri oxuduğunu və qəbul etdiyini təsdiq edir.
                </p>
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
