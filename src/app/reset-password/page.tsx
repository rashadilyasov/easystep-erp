"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthModalTrigger from "@/components/AuthModalTrigger";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-center">
        <p className="font-medium">Etibarsız və ya eksik link.</p>
        <p className="text-sm mt-1">Şifrə sıfırlama üçün e-poçtunuzdakı linkə keçid edin və ya yenidən tələb edin.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
          Şifrəni bərpa et →
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Şifrə ən azı 6 simvol olmalıdır");
      return;
    }
    if (password !== confirm) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      await api.auth.resetPassword(token, password);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">Şifrəniz uğurla dəyişdirildi.</p>
        <AuthModalTrigger mode="login" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
          Daxil ol
        </AuthModalTrigger>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Yeni şifrə</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Şifrəni təsdiq edin</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === "loading" ? "Yoxlanılır..." : "Şifrəni dəyişdir"}
      </button>
      <p className="text-center text-slate-600 text-sm">
        <AuthModalTrigger mode="login" className="text-primary-600 font-medium hover:underline">
          ← Daxil ol səhifəsinə qayıt
        </AuthModalTrigger>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/" />
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Yeni şifrə təyin et</h1>
          <p className="text-slate-600 text-sm mb-6">
            Yeni şifrənizi daxil edin.
          </p>
          <Suspense fallback={<div className="h-32 bg-slate-100 rounded animate-pulse" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
