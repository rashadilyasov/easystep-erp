"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (
      email: string,
      password: string,
      redirectTo = "/cabinet"
    ): Promise<{ requires2FA: true; pendingToken: string; viaEmail?: boolean; message?: string } | { success: true } | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.auth.login(email, password);
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
        const isConnError = /fetch|network|abort|vaxtı bitdi|failed to respond|çıxış yoxdur/i.test(msg);
        setError(isConnError ? "Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin." : msg);
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
        const isConnError = /fetch|network|abort|vaxtı bitdi|failed to respond|çıxış yoxdur/i.test(msg);
        setError(isConnError ? "Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin." : msg);
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
