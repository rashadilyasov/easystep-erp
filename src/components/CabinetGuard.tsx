"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CabinetGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      setAllowed(true);
    } else {
      router.replace("/login?redirect=/cabinet");
    }
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Yüklənir...</div>
      </div>
    );
  }

  return <>{children}</>;
}
