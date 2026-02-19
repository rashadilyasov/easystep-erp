import AcademyContent from "@/components/AcademyContent";

export const metadata = {
  title: "Easy Step ERP Academy - Videodərslər və Praktik İstifadə",
  description:
    "Sahibkar və əməkdaşlar üçün qısa videodərslər. Proqramı tez öyrənin və sistemi düzgün qurun.",
};

export default function Academy() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Akademiya</h1>
      <AcademyContent />
    </div>
  );
}
