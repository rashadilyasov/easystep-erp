import Link from "next/link";
import Logo from "@/components/Logo";
import RegisterAffiliateForm from "@/components/RegisterAffiliateForm";
import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Satış ortağı qeydiyyatı | Easy Step ERP",
  description: "Easy Step ERP satış ortağı proqramına qoşulun.",
};

export default function RegisterAffiliatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <Logo href="/" />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Satış ortağı qeydiyyatı</h1>
            <p className="text-slate-600 text-sm mb-6">Promo kodlar yaradın və müştəri cəlb edərək komissiya qazanın.</p>
            <RegisterAffiliateForm />
          </div>
          <p className="mt-6 text-center text-slate-600">
            Artıq hesabınız var?{" "}
            <Link href="/login?redirect=/affiliate" className="text-primary-600 font-medium hover:underline">
              Daxil ol
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
