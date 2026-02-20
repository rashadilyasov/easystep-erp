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
            <h2 className="text-xl font-bold text-slate-900 mb-6">Partnyor olmaq üçün şərtlər və tələblər</h2>
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>18 yaşdan yuxarı olmalı və Azərbaycan Respublikasının qanunlarına uyğun fəaliyyət göstərməlisiniz</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>Etibarlı e-poçt ünvanı və minimum 12 simvoldan ibarət güclü şifrə tələb olunur</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>Şərtlər və Məxfilik siyasətini qəbul etməlisiniz</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>Hər partnyor unikal promo kodlar yarada bilər; hər kod yalnız bir müştəri tərəfindən istifadə oluna bilər</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>Müştəri ödəniş etdikdən sonra komissiya hesablanır; komissiyalar admin tərəfindən təsdiqlənir və ödənilir</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span>Aldadıcı və ya yanlış məlumat vermək, spam və ya qeyri-qanuni təbliğat qadağandır</span>
              </li>
            </ul>

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
