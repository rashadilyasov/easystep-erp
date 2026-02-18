"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthModal } from "@/contexts/AuthModalContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Logo from "./Logo";

export default function AuthModal() {
  const [mounted, setMounted] = useState(false);
  const { isOpen, mode, close, openLogin, openRegister } = useAuthModal();

  useEffect(() => setMounted(true), []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) close();
    },
    [close]
  );

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    },
    [close]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!mounted || !isOpen || !mode) return null;

  const title = mode === "login" ? "Daxil ol" : "Qeydiyyat";

  const content = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal
      aria-labelledby="auth-modal-title"
      data-auth-modal-backdrop
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
        data-auth-modal-content
      >
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Bağla"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 pt-12">
          <div className="flex justify-center mb-6">
            <Logo href="/" />
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold text-slate-900 mb-6">
            {title}
          </h2>

          <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
            {mode === "login" ? <LoginForm /> : <RegisterForm />}
          </Suspense>

          <p className="mt-6 text-center text-slate-600">
            {mode === "login" ? (
              <>
                Hesabınız yoxdur?{" "}
                <button
                  type="button"
                  onClick={openRegister}
                  className="text-primary-600 font-medium hover:underline"
                >
                  Qeydiyyat
                </button>
              </>
            ) : (
              <>
                Artıq hesabınız var?{" "}
                <button
                  type="button"
                  onClick={openLogin}
                  className="text-primary-600 font-medium hover:underline"
                >
                  Daxil ol
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
}
