import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Ödəniş uğurla tamamlandı | Easy Step ERP",
  description: "Abunəliyiniz aktivləşdi.",
};

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödəniş uğurla tamamlandı</h1>
          <p className="text-slate-600 mb-8">
            Abunəliyiniz aktivləşdi. Masaüstü proqramı indi yükləyə bilərsiniz.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/cabinet/downloads" className="btn-primary">
              Yükləmələrə keç
            </Link>
            <Link href="/cabinet" className="text-slate-600 hover:text-slate-900 text-sm">
              Kabinete qayıt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
