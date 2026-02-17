"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Ad və ya şirkət adı daxil edin";
    if (!form.email.trim()) e.email = "E-poçt daxil edin";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Keçərli e-poçt daxil edin";
    if (!form.message.trim()) e.message = "Mesaj daxil edin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrors({});
    try {
      await api.contact.submit({
        name: form.name,
        email: form.email,
        message: form.message,
      });
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center">
        <p className="font-medium">Mesajınız uğurla göndərildi.</p>
        <p className="text-sm mt-1">Tezliklə sizinlə əlaqə saxlayacağıq.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-primary-600 hover:underline text-sm"
        >
          Başqa mesaj göndər
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {status === "error" && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Ad, Soyad və ya şirkət adı</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`w-full px-4 py-3 rounded-xl border input-focus ${
            errors.name ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="Ad Soyad və ya Şirkət MMC"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">E-poçt</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={`w-full px-4 py-3 rounded-xl border input-focus ${
            errors.email ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="email@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Mesaj</label>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={`w-full px-4 py-3 rounded-xl border input-focus ${
            errors.message ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="Mesajınızı yazın..."
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 btn-primary disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === "loading" ? "Göndərilir..." : "Göndər"}
      </button>
    </form>
  );
}
