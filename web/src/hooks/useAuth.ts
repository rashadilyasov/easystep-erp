"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string, redirectTo = "/cabinet") => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.auth.login(email, password);
        if (res.requires2FA && res.pendingToken) {
          return { requires2FA: true, pendingToken: res.pendingToken };
        }
        if (res.accessToken) {
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken);
          router.push(redirectTo.startsWith("/") ? redirectTo : "/cabinet");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xəta baş verdi");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const complete2FA = useCallback(
    async (pendingToken: string, code: string, redirectTo = "/admin") => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.auth.complete2FA(pendingToken, code);
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken);
        router.push(redirectTo.startsWith("/") ? redirectTo : "/admin");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xəta baş verdi");
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
    router.push("/");
  }, [router]);

  return { login, complete2FA, logout, loading, error };
}
