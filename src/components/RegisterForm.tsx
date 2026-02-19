"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    contactPerson: "",
    password: "",
    confirmPassword: "",
    taxId: "",
    country: "",
    city: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }
    if (form.password.length < 12) {
      setError("Şifrə minimum 12 simvol olmalıdır");
      return;
    }
    if (!form.acceptTerms) {
      setError("İstifadə şərtlərini qəbul etməlisiniz");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.auth.register({
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        taxId: form.taxId || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        acceptTerms: form.acceptTerms,
      });
      setSuccess(true);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Bağlantı xətası. Zəhmət olmasa internet bağlantınızı yoxlayın.";
      const msg = raw.includes("fetch") || raw.includes("network") || raw.toLowerCase().includes("failed")
        ? "Bağlantı xətası. İnterneti yoxlayın və bir az sonra yenidən cəhd edin."
        : raw;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">Qeydiyyat uğurla tamamlandı.</p>
        <p className="text-sm mt-1">E-poçtunuzu (hello@easysteperp.com-dan gələn) yoxlayın və təsdiq linkinə keçid edin.</p>
        <p className="text-sm mt-2">Təsdiq etdikdən sonra daxil ola biləcəksiniz.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Şirkət adı</label>
        <input
          type="text"
          required
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="Şirkət MMC"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">E-poçt</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Əlaqə şəxsi</label>
        <input
          type="text"
          required
          value={form.contactPerson}
          onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="Ad Soyad"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">VÖEN</label>
        <input
          type="text"
          value={form.taxId}
          onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="Opsional"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Şifrə (min 12 simvol)</label>
        <input
          type="password"
          required
          minLength={12}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Şifrə təsdiqi</label>
        <input
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
      </div>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))}
          className="mt-1 rounded"
        />
        <span className="text-sm text-slate-600">
          <Link href="/terms" className="text-primary-600 hover:underline">İstifadə şərtləri</Link> və{" "}
          <Link href="/privacy" className="text-primary-600 hover:underline">Məxfilik</Link> siyasətini qəbul edirəm.
        </span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loading ? "Yüklənir..." : "Qeydiyyat"}
      </button>
    </form>
  );
}
