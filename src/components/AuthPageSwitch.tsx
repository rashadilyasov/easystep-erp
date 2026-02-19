"use client";

import { useAuthModal } from "@/contexts/AuthModalContext";

type Mode = "login" | "register";

export default function AuthPageSwitch({ mode }: { mode: Mode }) {
  const { openLogin, openRegister } = useAuthModal();

  if (mode === "login") {
    return (
      <p className="mt-6 text-center text-slate-600">
        Hesabınız yoxdur?{" "}
        <button
          type="button"
          onClick={openRegister}
          className="text-primary-600 font-medium hover:underline"
        >
          Qeydiyyat
        </button>
      </p>
    );
  }

  return (
    <p className="mt-6 text-center text-slate-600">
      Artıq hesabınız var?{" "}
      <button
        type="button"
        onClick={openLogin}
        className="text-primary-600 font-medium hover:underline"
      >
        Daxil ol
      </button>
    </p>
  );
}
