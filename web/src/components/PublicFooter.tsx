import Link from "next/link";
import Logo from "./Logo";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/80 py-10 px-4 bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Logo href="/" width={100} height={28} className="h-7" />
          <span className="text-slate-600">© Bütün hüquqlar qorunur.</span>
        </div>
        <div className="flex gap-6">
          <Link href="/security" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
            Təhlükəsizlik
          </Link>
          <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">İstifadə şərtləri</Link>
          <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">Məxfilik</Link>
          <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
            Əlaqə
          </Link>
        </div>
      </div>
    </footer>
  );
}
