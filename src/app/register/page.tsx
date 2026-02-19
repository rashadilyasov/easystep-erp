import Link from "next/link";
import Logo from "@/components/Logo";
import RegisterForm from "@/components/RegisterForm";
import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Qeydiyyat | Easy Step ERP",
  description: "Təchizatçı şirkəti kimi Easy Step ERP-ə qeydiyyat olun.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <Logo href="/" />
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Qeydiyyat</h1>
            <RegisterForm />
          </div>
          <p className="mt-6 text-center text-slate-600">
            Artıq hesabınız var?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Daxil ol
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
