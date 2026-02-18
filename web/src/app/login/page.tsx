import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";
import AuthPageSwitch from "@/components/AuthPageSwitch";
import PublicHeader from "@/components/PublicHeader";

export const metadata = {
  title: "Daxil ol | Easy Step ERP",
  description: "Easy Step ERP hesabınıza daxil olun.",
};

export default function Login() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="pt-24 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Daxil ol</h1>
          <LoginForm />
          <AuthPageSwitch mode="login" />
        </div>
      </div>
      </div>
    </div>
  );
}
