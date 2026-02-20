"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tenants", label: "Tenantlar" },
  { href: "/admin/plans", label: "Planlar" },
  { href: "/admin/payments", label: "Ödənişlər" },
  { href: "/admin/content", label: "Kontent" },
  { href: "/admin/site-content", label: "Səhifə kontenti" },
  { href: "/admin/affiliates", label: "Satış ortakları" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/security", label: "Təhlükəsizlik (2FA)" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-bold">
            Easy Step <span className="text-amber-400">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/cabinet" className="text-slate-300 hover:text-white text-sm">
              Müştəri paneline
            </Link>
            <button
              type="button"
              onClick={async () => {
                try { await api.auth.logout(); } catch { /* ignore */ }
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/";
              }}
              className="text-slate-300 hover:text-white text-sm"
            >
              Çıxış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="w-56 shrink-0">
            <nav className="space-y-1">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                    pathname === item.href
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
