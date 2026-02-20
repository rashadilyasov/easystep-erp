"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";

const affiliateNav = [
  { href: "/affiliate", label: "Panel" },
  { href: "/affiliate/promo-codes", label: "Promo kodlar" },
  { href: "/affiliate/commissions", label: "Komissiyalar" },
];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/affiliate" className="text-xl font-bold">
            Easy Step Satış ortağı
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-300 hover:text-white text-sm">
              Sayta qayıt
            </Link>
            <button
              type="button"
              onClick={() => logout()}
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
              {affiliateNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pathname === item.href ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
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
