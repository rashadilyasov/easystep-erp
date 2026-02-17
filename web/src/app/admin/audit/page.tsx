import AdminAuditContent from "@/components/AdminAuditContent";

export default function Audit() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Audit log</h1>
      <AdminAuditContent />
    </div>
  );
}
