"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { api } from "@/lib/api";

type NavItem = "features" | "pricing" | "contact" | "security" | null;

export default function PublicHeader({ active }: { active?: NavItem }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { openLogin, openRegister } = useAuthModal();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = async () => {
      if (!localStorage.getItem("accessToken")) {
        setUserRole(null);
        return;
      }
      try {
        const me = await api.me();
        setUserRole(me?.role ?? null);
      } catch {
        setUserRole(null);
      }
    };
    refresh();
    window.addEventListener("auth-changed", refresh);
    return () => window.removeEventListener("auth-changed", refresh);
  }, []);
  const linkClass = (item: NavItem) =>
    item === active
      ? "text-primary-600 font-medium"
      : "text-slate-600 hover:text-slate-900 transition-colors duration-200";

  const handleOpenLogin = () => {
    setMobileOpen(false);
    openLogin();
  };
  const handleOpenRegister = () => {
    setMobileOpen(false);
    openRegister();
  };

  const navLinks = (
    <>
      <Link href="/features" className={`py-2 lg:py-0 ${linkClass("features")}`} onClick={() => setMobileOpen(false)}>
        Xüsusiyyətlər
      </Link>
      <Link href="/pricing" className={`py-2 lg:py-0 ${linkClass("pricing")}`} onClick={() => setMobileOpen(false)}>
        Qiymətlər
      </Link>
      <Link href="/contact" className={`py-2 lg:py-0 ${linkClass("contact")}`} onClick={() => setMobileOpen(false)}>
        Əlaqə
      </Link>
      <Link href="/security" className={`py-2 lg:py-0 ${linkClass("security")}`} onClick={() => setMobileOpen(false)}>
        Təhlükəsizlik
      </Link>
      <Link href="/satis-partnyorlari" className={`py-2 lg:py-0 ${linkClass(null)}`} onClick={() => setMobileOpen(false)}>
        Satış Partnyorları
      </Link>
      {userRole ? (
        <>
          {userRole === "SuperAdmin" && (
            <Link href="/admin" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium" onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
          )}
          {userRole === "Affiliate" && (
            <Link href="/affiliate" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium" onClick={() => setMobileOpen(false)}>
              Satış partnyoru paneli
            </Link>
          )}
          {(userRole === "CustomerAdmin" || userRole === "CustomerUser" || (userRole && !["SuperAdmin", "Affiliate"].includes(userRole))) && (
            <Link href="/cabinet" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium" onClick={() => setMobileOpen(false)}>
              Panelim
            </Link>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className={`py-2 lg:py-0 bg-transparent border-none cursor-pointer font-inherit ${linkClass(null)}`}
            onClick={handleOpenLogin}
            data-auth-trigger="login"
          >
            Daxil ol
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
            onClick={handleOpenRegister}
            data-auth-trigger="register"
          >
            Qeydiyyat
          </button>
        </>
      )}
    </>
  );

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-shrink">
          <Logo href="/" />
        </div>
        <div className="hidden lg:flex items-center gap-6">{navLinks}</div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          aria-label="Menyu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white py-4 px-4 flex flex-col gap-3">
          {navLinks}
        </div>
      )}
    </header>
  );
}
