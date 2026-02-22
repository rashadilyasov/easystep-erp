"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { openForgotPassword } = useAuthModal();

  useEffect(() => {
    openForgotPassword();
    router.replace("/");
  }, [openForgotPassword, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-600">Yönləndirilir...</p>
    </div>
  );
}
