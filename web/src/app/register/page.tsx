import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Qeydiyyat | Easy Step ERP",
  description: "Təchizatçı şirkəti kimi Easy Step ERP-ə qeydiyyat olun.",
};

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Qeydiyyat</h1>
          <RegisterForm />
          <p className="mt-6 text-center text-slate-600">
            Artıq hesabınız var?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Daxil ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
