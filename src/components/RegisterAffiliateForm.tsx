"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

function isStrongPassword(p: string): boolean {
  if (!p || p.length < 12) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  return true;
}

export default function RegisterAffiliateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    age18Confirmed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }
    if (!isStrongPassword(form.password)) {
      setError(form.password.length < 12 ? "Şifrə minimum 12 simvol olmalıdır" : "Şifrə böyük hərf, kiçik hərf və rəqəm əlavə edin");
      return;
    }
    if (!form.acceptTerms) {
      setError("Şərtləri qəbul etməlisiniz");
      return;
    }
    if (!form.age18Confirmed) {
      setError("18 yaşdan yuxarı olduğunuzu təsdiqləməlisiniz");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.auth.registerAffiliate({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        acceptTerms: form.acceptTerms,
        age18Confirmed: form.age18Confirmed,
      });
      setSuccess(true);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Bağlantı xətası.";
      setError(raw);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">Qeydiyyat uğurla tamamlandı.</p>
        <p className="text-sm mt-1">E-poçtunuzu yoxlayın və təsdiq linkinə keçid edin.</p>
        <p className="text-sm mt-2">E-poçt təsdiqindən sonra admin qeydiyyatınızı təsdiqləyəcək. Təsdiqləndikdən sonra promo kodlar yarada biləcəksiniz.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm break-words whitespace-pre-wrap">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="Ad Soyad"
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
        <label className="block text-sm font-medium text-slate-700 mb-2">Şifrə (min 12 simvol, böyük/kiçik hərf, rəqəm)</label>
        <input
          type="password"
          required
          minLength={12}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 input-focus"
          placeholder="••••••••"
        />
        {form.password && !isStrongPassword(form.password) && (
          <p className="text-xs text-amber-600 mt-1">
            Böyük hərf, kiçik hərf və rəqəm əlavə edin
          </p>
        )}
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
          checked={form.age18Confirmed}
          onChange={(e) => setForm((f) => ({ ...f, age18Confirmed: e.target.checked }))}
          className="mt-1 rounded"
        />
        <span className="text-sm text-slate-600">
          18 yaşdan yuxarıyam və qanuni fəaliyyət göstərəcəyimi təsdiq edirəm.
        </span>
      </label>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))}
          className="mt-1 rounded"
        />
        <span className="text-sm text-slate-600">
          <Link href="/terms" className="text-primary-600 hover:underline">Şərtlər</Link> və{" "}
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
