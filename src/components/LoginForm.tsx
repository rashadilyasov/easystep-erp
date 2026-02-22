"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { api } from "@/lib/api";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { close, loginRedirect } = useAuthModal();
  const redirect = loginRedirect || searchParams.get("redirect") || "/cabinet";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [pendingToken, setPendingToken] = useState("");
  const [code2FA, setCode2FA] = useState("");
  const [viaEmail, setViaEmail] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const { login, complete2FA, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "2fa") {
      const ok = await complete2FA(pendingToken, code2FA, /^\/(admin|affiliate|cabinet)/.test(redirect) ? redirect : "/cabinet");
      if (ok) close();
      return;
    }
    const result = await login(email, password, redirect);
    if (result && "requires2FA" in result && result.requires2FA && result.pendingToken) {
      setPendingToken(result.pendingToken);
      setViaEmail(result.viaEmail ?? false);
      setStep("2fa");
      setCode2FA("");
    } else if (result && "success" in result) {
      close();
    }
  };

  const handleResendOtp = async () => {
    if (!pendingToken) return;
    setResendError(null);
    try {
      await api.auth.twoFactorRequestEmailOtp(pendingToken);
    } catch (e) {
      setResendError(e instanceof Error ? e.message : "Xəta");
    }
  };

  if (step === "2fa") {
    return (
      <form className="space-y-4" onSubmit={handleSubmit}>
        {(error || resendError) && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm leading-relaxed">{error || resendError}</div>
        )}
        <p className="text-slate-600 text-sm">
          {viaEmail ? "E-poçtunuza göndərilən 6 rəqəmli kodu daxil edin." : "Autentifikator tətbiqindən 6 rəqəmli kodu daxil edin."}
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">2FA kodu</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code2FA}
            onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus text-center text-lg tracking-widest"
            placeholder="000000"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep("credentials")}
            className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Geri
          </button>
          {viaEmail && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Kodu yenidən göndər
            </button>
          )}
          <button
            type="submit"
            disabled={loading || code2FA.length !== 6}
            className="flex-1 py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0 min-w-[120px]"
          >
            {loading ? "Yoxlanılır..." : "Təsdiq"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm leading-relaxed">
          {error}
          {(error.includes("API") || error.includes("Backend") || error.includes("/api/ping")) && (
            <a href="/api/ping" target="_blank" rel="noopener noreferrer" className="block mt-2 text-primary-600 hover:underline text-xs">
              API vəziyyətini yoxlayın →
            </a>
          )}
        </div>
      )}
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Şifrə</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-sm text-slate-600">Xatırla</span>
        </label>
        <button
          type="button"
          onClick={() => {
            close();
            router.push("/forgot-password");
          }}
          className="text-sm text-primary-600 hover:underline leading-relaxed"
        >
          Şifrəni unutdum
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? "Yüklənir..." : "Daxil ol"}
      </button>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
      <LoginFormInner />
    </Suspense>
  );
}
