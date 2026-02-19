"use client";

import { useState } from "react";
import AuthModalTrigger from "./AuthModalTrigger";
import { api } from "@/lib/api";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setError(null);
    try {
      await api.auth.forgotPassword(email);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">Şifrə sıfırlama linki e-poçtunuza göndərildi.</p>
        <p className="text-sm mt-1">Spam qovluğunu da yoxlayın.</p>
        <AuthModalTrigger mode="login" className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium">
          ← Daxil ol səhifəsinə qayıt
        </AuthModalTrigger>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">E-poçt</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="email@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === "loading" ? "Göndərilir..." : "Göndər"}
      </button>
      <p className="text-center text-slate-600 text-sm">
        <AuthModalTrigger mode="login" className="text-primary-600 font-medium hover:underline">
          ← Daxil ol səhifəsinə qayıt
        </AuthModalTrigger>
      </p>
    </form>
  );
}
