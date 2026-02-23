"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type ProfileData = {
  email: string;
  phone: string;
  bankIban: string;
  bankName: string;
  bankAccountHolder: string;
  payriffInfo: string;
  commissionReceiveMethod: number;
  commissionAccountNote: string;
};

const COMMISSION_METHODS = [
  { value: 0, label: "Seçilməyib" },
  { value: 1, label: "Bank köçürməsi" },
  { value: 2, label: "Payriff" },
  { value: 3, label: "Kart / Digər" },
];

export default function AffiliateProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    email: "",
    phone: "",
    bankIban: "",
    bankName: "",
    bankAccountHolder: "",
    payriffInfo: "",
    commissionReceiveMethod: 0,
    commissionAccountNote: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    api.affiliate
      .profile()
      .then((p) => {
        setData(p);
        setForm({
          email: p.email ?? "",
          phone: p.phone ?? "",
          bankIban: p.bankIban ?? "",
          bankName: p.bankName ?? "",
          bankAccountHolder: p.bankAccountHolder ?? "",
          payriffInfo: p.payriffInfo ?? "",
          commissionReceiveMethod: p.commissionReceiveMethod ?? 0,
          commissionAccountNote: p.commissionAccountNote ?? "",
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.affiliate.updateProfile({
        phone: form.phone,
        bankIban: form.bankIban,
        bankName: form.bankName,
        bankAccountHolder: form.bankAccountHolder,
        payriffInfo: form.payriffInfo,
        commissionReceiveMethod: form.commissionReceiveMethod,
        commissionAccountNote: form.commissionAccountNote,
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil</h1>
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil və ödəniş rekvizitləri</h1>
      <p className="text-slate-600 mb-6">
        Telefon, bank rekvizitləri (IBAN, bank adı), Payriff məlumatı və komissiyanı hansı hesaba almaq istədiyinizi buradan yeniləyə bilərsiniz. Admin komissiya ödəyəndə bu məlumatlardan istifadə olunacaq.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-poçt</label>
          <input type="email" value={form.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
          <p className="text-xs text-slate-500 mt-1">E-poçt dəyişdirilə bilməz</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="+994 50 123 45 67"
          />
        </div>

        <hr className="border-slate-200" />
        <h2 className="font-semibold text-slate-900">Bank rekvizitləri</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
          <input
            type="text"
            value={form.bankIban}
            onChange={(e) => setForm((f) => ({ ...f, bankIban: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            placeholder="AZ00 XXXX XXXX XXXX XXXX XXXX XXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank adı</label>
          <input
            type="text"
            value={form.bankName}
            onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="Məs: Kapital Bank"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hesab sahibi adı</label>
          <input
            type="text"
            value={form.bankAccountHolder}
            onChange={(e) => setForm((f) => ({ ...f, bankAccountHolder: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="Ad Soyad və ya şirkət adı"
          />
        </div>

        <hr className="border-slate-200" />
        <h2 className="font-semibold text-slate-900">Payriff məlumatı</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payriff</label>
          <input
            type="text"
            value={form.payriffInfo}
            onChange={(e) => setForm((f) => ({ ...f, payriffInfo: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="Kart son 4 rəqəm (məs: **** 1234) və ya Payriff telefon nömrəsi"
          />
          <p className="text-xs text-slate-500 mt-1">Tam kart nömrəsi saxlanmır. Yalnız son 4 rəqəm və ya əlaqə məlumatı.</p>
        </div>

        <hr className="border-slate-200" />
        <h2 className="font-semibold text-slate-900">Komissiya ödəniş üstünlüyü</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Komissiya hansı hesaba ödənilsin?</label>
          <select
            value={form.commissionReceiveMethod}
            onChange={(e) => setForm((f) => ({ ...f, commissionReceiveMethod: parseInt(e.target.value, 10) || 0 }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          >
            {COMMISSION_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Əlavə qeyd (opsional)</label>
          <textarea
            value={form.commissionAccountNote}
            onChange={(e) => setForm((f) => ({ ...f, commissionAccountNote: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            rows={2}
            placeholder="Məs: AZN hesabı, kart nömrəsi sonu, və s."
          />
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? "Saxlanır..." : "Saxla"}
          </button>
        </div>
      </div>
    </div>
  );
}
