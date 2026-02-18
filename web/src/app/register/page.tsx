import RegisterForm from "@/components/RegisterForm";
import Logo from "@/components/Logo";
import AuthPageSwitch from "@/components/AuthPageSwitch";
import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Qeydiyyat | Easy Step ERP",
  description: "Təchizatçı şirkəti kimi Easy Step ERP-ə qeydiyyat olun.",
};

export default function Register() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="pt-24 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Qeydiyyat</h1>
          <RegisterForm />
          <AuthPageSwitch mode="register" />
        </div>
      </div>
    </div>
    </div>
  );
}
