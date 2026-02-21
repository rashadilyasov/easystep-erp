"use client";

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function SatisPartnyorlariPage() {
  const { openLogin, openRegisterAffiliate } = useAuthModal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader active={null} />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-center">
            Satış Partnyorları
          </h1>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Easy Step ERP ilə əməkdaşlıq edin, promo kodlar yaradın və müştəri cəlb etdikcə komissiya qazanın.
          </p>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Partnyor Qaydaları və Bonus Mexanizmi</h2>

            <div className="space-y-8 text-slate-600">
              <section>
                <h3 className="font-semibold text-slate-900 mb-3">1️⃣ Hər Müştəri Üçün Unikal Promo Kod</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Hər partnyor hər yeni müştəri üçün unikal promo kod yaradır.</li>
                  <li>• Hər promo kod yalnız bir müştəri tərəfindən istifadə oluna bilər.</li>
                  <li>• Promo kod müştəri üçün 1 il müddətində endirim təmin edir.</li>
                  <li>• Partnyor üçün həmin kod üzrə komissiya müştəri ilə əməkdaşlıq bitənə qədər aktivdir.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">2️⃣ Minimum Müştəri Şərti (Bonus)</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Bonus almaq üçün ay ərzində ən azı 5 müştəri ödəniş etməlidir.</li>
                  <li>• Bu müştərilər fərqli promo kodlarla ola bilər.</li>
                  <li>• Ayın sonunda admin paneli aktiv müştəriləri yoxlayır və bonusu təsdiqləyir.</li>
                  <li>• 5-dən az müştəri olduqda bonus növbəti ay üçün saxlanılır.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">3️⃣ Hesab və Təhlükəsizlik</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Etibarlı e-poçt ünvanı tələb olunur; şifrə minimum 12 simvollu və güclü olmalıdır.</li>
                  <li>• Hər partnyor hesabını qorumaq və şəxsi məlumatlarını düzgün saxlamaq öhdəliyinə malikdir.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">4️⃣ Qaydaların Qəbul Edilməsi</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Partnyor qeydiyyat zamanı <Link href="/terms" className="text-primary-600 hover:underline">Şərtlər</Link> və <Link href="/privacy" className="text-primary-600 hover:underline">Məxfilik Siyasətini</Link> qəbul etməlidir.</li>
                  <li>• Bu siyasətə riayət etmək partnyorun öhdəliyidir.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">5️⃣ Komissiya və Ödəniş</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Müştəri ödəniş etdikdən sonra komissiya hesablanır.</li>
                  <li>• Ödəniş və təsdiqləmə prosesi admin tərəfindən idarə olunur.</li>
                  <li>• Partnyor yalnız həqiqi satışlar üçün komissiya və bonus ala bilər.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-900 mb-3">6️⃣ Qadağan Olunmuş Fəaliyyətlər</h3>
                <ul className="space-y-2 pl-4">
                  <li>• Aldadıcı məlumat vermək, spam göndərmək və qeyri-qanuni təbliğat qəti qadağandır.</li>
                  <li>• Bütün fəaliyyətlər admin paneli vasitəsilə izlənir.</li>
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
