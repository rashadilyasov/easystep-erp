import { Suspense } from "react";
import PublicHeader from "@/components/PublicHeader";
import AuthPageOpener from "@/components/AuthPageOpener";

export const metadata = {
  title: "Daxil ol | Easy Step ERP",
  description: "Easy Step ERP hesabınıza daxil olun.",
};

export default function Login() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <Suspense fallback={<div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" /></div>}>
        <AuthPageOpener mode="login" />
      </Suspense>
    </div>
  );
}
