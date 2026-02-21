"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Logo href="/" className="mb-6" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Dəvət linki tapılmadı</h1>
          <p className="text-slate-600 text-sm mb-4">Düzgün dəvət linkinə keçid edin və ya şirkət idarəçisindən yeni dəvət tələb edin.</p>
          <Link href="/login" className="text-primary-600 hover:underline font-medium">Daxil ol</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Logo href="/" className="mb-6" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-green-700 mb-2">Qeydiyyat tamamlandı</h1>
          <p className="text-slate-600 text-sm mb-4">İndi kabinetə yönləndirilirsiniz...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }
    if (password.length < 12) {
      setError("Şifrə minimum 12 simvol olmalıdır");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.acceptInvite(token, password);
      if (res.accessToken && res.refreshToken) {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken);
        }
        setSuccess(true);
        setTimeout(() => router.replace("/cabinet"), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Logo href="/" className="mb-6" />
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Dəvəti qəbul edin</h1>
        <p className="text-slate-600 text-sm mb-6">Şifrənizi təyin edərək qeydiyyatı tamamlayın.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifrə (min 12 simvol)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
              minLength={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifrə təsdiqi</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
              minLength={12}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-70"
          >
            {loading ? "Qeydiyyat edilir..." : "Tamamla"}
          </button>
        </form>
        <p className="mt-4 text-slate-500 text-xs">
          Şifrədə böyük hərf, kiçik hərf və rəqəm olmalıdır.
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <InviteContent />
    </Suspense>
  );
}
