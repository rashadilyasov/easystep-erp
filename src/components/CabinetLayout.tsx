"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";

const cabinetNav = [
  { href: "/cabinet", label: "Panel" },
  { href: "/cabinet/billing", label: "Ödənişlər" },
  { href: "/cabinet/downloads", label: "Yükləmələr" },
  { href: "/cabinet/licenses", label: "Lisenziyalar & Cihazlar" },
  { href: "/cabinet/academy", label: "Akademiya" },
  { href: "/cabinet/support", label: "Dəstək" },
  { href: "/cabinet/settings", label: "Parametrlər" },
  { href: "/cabinet/security", label: "2FA" },
];

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo href="/cabinet" />
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
              Sayta qayıt
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="text-slate-600 hover:text-slate-900 text-sm"
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
              {cabinetNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pathname === item.href
                      ? "bg-primary-100 text-primary-700"
                      : "text-slate-700 hover:bg-slate-100"
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
