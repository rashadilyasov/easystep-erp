"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

async function getApiBase(): Promise<string> {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    const d = (await r.json()) as { apiBase?: string };
    return (d?.apiBase || process.env.NEXT_PUBLIC_API_URL || "https://api.easysteperp.com").replace(/\/$/, "");
  } catch {
    return (process.env.NEXT_PUBLIC_API_URL || "https://api.easysteperp.com").replace(/\/$/, "");
  }
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiBaseRef = useRef<string | null>(null);

  const login = useCallback(
    async (
      email: string,
      password: string,
      redirectTo = "/cabinet"
    ): Promise<{ requires2FA: true; pendingToken: string; viaEmail?: boolean; message?: string } | { success: true } | undefined> => {
      setLoading(true);
      setError(null);
      try {
        let res: Awaited<ReturnType<typeof api.auth.login>>;
        try {
          res = await api.auth.login(email, password);
        } catch (proxyErr) {
          const base = apiBaseRef.current ?? (apiBaseRef.current = await getApiBase());
          const directRes = await fetch(`${base}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(30000),
          });
          const text = await directRes.text();
          if (!directRes.ok) throw new Error(text?.slice(0, 300) || directRes.statusText);
          res = text ? (JSON.parse(text) as Awaited<ReturnType<typeof api.auth.login>>) : {};
          if (!res.accessToken && !res.requires2FA) throw proxyErr;
        }
        if (res.requires2FA && res.pendingToken) {
          return { requires2FA: true, pendingToken: res.pendingToken, viaEmail: res.viaEmail, message: res.message };
        }
        if (res.accessToken) {
          localStorage.setItem("accessToken", res.accessToken);
          if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth-changed"));
          router.push(redirectTo.startsWith("/") ? redirectTo : "/cabinet");
          return { success: true };
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Xəta baş verdi";
        const isBackendUnreachable = /Backend API-ya çıxış yoxdur|API_URL|502/i.test(msg);
        const isConnError = /fetch|network|abort|vaxtı bitdi|failed to respond/i.test(msg) && !isBackendUnreachable;
        setError(
          isBackendUnreachable
            ? "Backend API çatılmır. Vercel-də API_URL və Railway statusunu yoxlayın. /api/ping açın."
            : isConnError
              ? "Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin."
              : msg
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const complete2FA = useCallback(
    async (pendingToken: string, code: string, redirectTo = "/admin"): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.auth.complete2FA(pendingToken, code);
        localStorage.setItem("accessToken", res.accessToken);
        if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth-changed"));
        router.push(redirectTo.startsWith("/") ? redirectTo : "/admin");
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Xəta baş verdi";
        const isBackendUnreachable = /Backend API-ya çıxış yoxdur|API_URL|502/i.test(msg);
        const isConnError = /fetch|network|abort|vaxtı bitdi|failed to respond/i.test(msg) && !isBackendUnreachable;
        setError(
          isBackendUnreachable
            ? "Backend API çatılmır. Vercel API_URL və Railway yoxlayın. /api/ping açın."
            : isConnError
              ? "Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin."
              : msg
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch { /* ignore - still log out locally */ }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth-changed"));
    router.push("/");
  }, [router]);

  return { login, complete2FA, logout, loading, error };
}
