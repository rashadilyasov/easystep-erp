"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";
import AuthModalTrigger from "@/components/AuthModalTrigger";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || status !== "idle") return;
    setStatus("loading");
    api.auth
      .verifyEmail(token)
      .then((r) => {
        setMessage(r.message ?? "E-poçtunuz təsdiqləndi.");
        setStatus("success");
      })
      .catch((e) => {
        setMessage(e instanceof Error ? e.message : "API xətası");
        setStatus("error");
      });
  }, [token, status]);

  if (!token) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-center">
        <p className="font-medium">Etibarsız və ya natamam link.</p>
        <p className="text-sm mt-1">E-poçt təsdiqi üçün e-poçtunuzdakı linkə keçid edin.</p>
        <AuthModalTrigger mode="login" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
          Daxil ol →
        </AuthModalTrigger>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600">E-poçtunuz təsdiqlənir...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">{message}</p>
        <AuthModalTrigger mode="login" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
          Daxil ol
        </AuthModalTrigger>
      </div>
    );
  }

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center">
      <p className="font-medium">{message}</p>
      <AuthModalTrigger mode="register" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
        Yenidən qeydiyyatdan keç
      </AuthModalTrigger>
      <span className="mx-2">və ya</span>
      <Link href="/contact" className="text-primary-600 hover:underline text-sm font-medium">
        Bizimlə əlaqə
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">E-poçt təsdiqi</h1>
          <p className="text-slate-600 text-sm mb-6">
            Hesabınızı aktivləşdiririk...
          </p>
          <Suspense fallback={<div className="h-32 bg-slate-100 rounded animate-pulse" />}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
