import DashboardStats from "@/components/DashboardStats";

export default function CabinetDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel</h1>
      <DashboardStats />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
          <h3 className="font-semibold text-slate-900 mb-2">Sürətli keçidlər</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Yükləmə — masaüstü ERP quraşdırıcısı</li>
            <li>• Ödənişlər - Plan və faktura</li>
            <li>• Akademiya - Video təlimatlar</li>
          </ul>
        </div>
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <h3 className="font-semibold text-amber-800 mb-2">Xəbərdarlıq</h3>
          <p className="text-amber-700 text-sm">
            Abunə bitməyə 7 gün qalmış sizə xəbərdarlıq göndəriləcək.
          </p>
        </div>
      </div>
    </div>
  );
}
