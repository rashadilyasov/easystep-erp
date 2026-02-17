import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Daxil ol | Easy Step ERP",
  description: "Easy Step ERP hesabınıza daxil olun.",
};

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Daxil ol</h1>
          <LoginForm />
          <p className="mt-6 text-center text-slate-600">
            Hesabınız yoxdur?{" "}
            <Link href="/register" className="text-primary-600 font-medium hover:underline">
              Qeydiyyat
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
