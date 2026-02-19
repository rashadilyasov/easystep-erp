import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Şifrəni bərpa et | Easy Step ERP",
  description: "E-poçt ünvanınızı daxil edin, şifrə sıfırlama linki göndərəcəyik.",
};

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Şifrəni bərpa et</h1>
          <p className="text-slate-600 text-sm mb-6">
            E-poçt ünvanınızı daxil edin. Sizə şifrə sıfırlama linki göndərəcəyik.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
