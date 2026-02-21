"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type TenantData = {
  name: string;
  taxId?: string;
  contactPerson: string;
  country?: string;
  city?: string;
};

export default function SettingsContent() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<TenantData>({
    name: "",
    taxId: "",
    contactPerson: "",
    country: "Azərbaycan",
    city: "",
  });
  const [autoRenew, setAutoRenew] = useState(true);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);

  useEffect(() => {
    api
      .tenant()
      .then((t) => {
        setTenant(t);
        setForm({
          name: t.name ?? "",
          taxId: t.taxId ?? "",
          contactPerson: t.contactPerson ?? "",
          country: t.country ?? "Azərbaycan",
          city: t.city ?? "",
        });
      })
      .catch(() => setTenant(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.billing().then((b: { autoRenew?: boolean }) => setAutoRenew(b.autoRenew ?? true)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateTenant(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoRenewChange = async (checked: boolean) => {
    setAutoRenewLoading(true);
    try {
      await api.setAutoRenew(checked);
      setAutoRenew(checked);
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setAutoRenewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="p-6 bg-white rounded-2xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Şirkət profili</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Şirkət adı</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
              placeholder="Şirkət MMC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VÖEN</label>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
              placeholder="Vacib deyil"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Əlaqədar şəxs</label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ölkə</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Şəhər</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
              />
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-70"
            >
              {saving ? "Saxlanılır..." : saved ? "Saxlanıldı" : "Yadda saxla"}
            </button>
            {saved && <span className="text-green-600 text-sm">Uğurla saxlanıldı</span>}
          </div>
        </div>
      </section>

      <section className="p-6 bg-white rounded-2xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Abunə</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => handleAutoRenewChange(e.target.checked)}
            disabled={autoRenewLoading}
            className="rounded"
          />
          <span className="text-slate-600">Avtomatik yeniləmə</span>
        </label>
      </section>

      <section className="p-6 bg-white rounded-2xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">İstifadəçilər</h3>
        <p className="text-slate-600 text-sm mb-4">Şirkət üzvlərinin idarəetməsi.</p>
        <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" disabled>
          İstifadəçi dəvət et (tezliklə)
        </button>
      </section>

      <section className="p-6 bg-white rounded-2xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">2FA (İki faktorlu doğrulama)</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" disabled />
          <span className="text-slate-600">2FA aktiv et (tezliklə)</span>
        </label>
      </section>
    </div>
  );
}
