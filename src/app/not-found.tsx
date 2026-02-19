import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-8xl font-bold text-primary-600/20">404</h1>
        <p className="text-xl text-slate-600 mt-4">Səhifə tapılmadı</p>
        <p className="text-slate-500 mt-2">Axtardığınız səhifə mövcud deyil və ya köçürülüb.</p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn-primary">
            Ana səhifə
          </Link>
          <Link href="/contact" className="btn-secondary">
            Əlaqə
          </Link>
        </div>
      </div>
    </div>
  );
}
