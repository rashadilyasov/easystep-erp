"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/contexts/AuthModalContext";

/**
 * Opens auth modal on mount and redirects to home. Use on /login and /register pages.
 */
export default function AuthPageOpener({ mode }: { mode: "login" | "register" }) {
  const { openLogin, openRegister } = useAuthModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (mode === "login") {
      openLogin();
    } else {
      openRegister();
    }
    const redirect = searchParams.get("redirect");
    const target = redirect ? `/?redirect=${encodeURIComponent(redirect)}` : "/";
    router.replace(target);
  }, [mode, openLogin, openRegister, router, searchParams]);

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );
}
