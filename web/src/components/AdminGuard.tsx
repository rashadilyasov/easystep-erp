"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login?redirect=/admin");
      return;
    }
    setError(null);
    api
      .me()
      .then((u) => {
        if (u.role === "SuperAdmin") setAllowed(true);
        else router.replace("/cabinet");
      })
      .catch((e) => {
        if (e?.name === "AbortError") {
          setError("API cavab vermir. Zəhmət olmasa API-nin işlədiyini yoxlayın (port 5000).");
        } else {
          router.replace("/login?redirect=/admin");
        }
      });
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-slate-700 text-center max-w-md">{error}</p>
        <Link href="/admin" className="text-primary-600 hover:underline font-medium">
          Yenidən yoxla
        </Link>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Yüklənir...</div>
      </div>
    );
  }

  return <>{children}</>;
}
