import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Ödəniş ləğv edildi | Easy Step ERP",
  description: "Ödəniş prosesi dayandırıldı.",
};

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödəniş ləğv edildi</h1>
          <p className="text-slate-600 mb-8">
            Ödəniş prosesi dayandırıldı. İstəsəniz yenidən cəhd edə bilərsiniz.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/pricing" className="btn-primary">
              Qiymətlərə qayıt
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
