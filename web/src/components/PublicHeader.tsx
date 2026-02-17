"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

type NavItem = "features" | "pricing" | "contact" | "security" | null;

export default function PublicHeader({ active }: { active?: NavItem }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const linkClass = (item: NavItem) =>
    item === active
      ? "text-primary-600 font-medium"
      : "text-slate-600 hover:text-slate-900 transition-colors duration-200";

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
      <Link href="/login" className={`py-2 lg:py-0 ${linkClass(null)}`} onClick={() => setMobileOpen(false)}>
        Daxil ol
      </Link>
      <Link
        href="/register"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0"
        onClick={() => setMobileOpen(false)}
      >
        Qeydiyyat
      </Link>
    </>
  );

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo href="/" />
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
