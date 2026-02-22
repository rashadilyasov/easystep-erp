"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type SmtpSettings = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  useSsl: boolean;
  fromAddresses: string[];
};

type TemplateItem = { key: string; label: string };

export default function AdminEmailSettingsPage() {
  const [tab, setTab] = useState<"smtp" | "templates" | "bulk">("smtp");
  const [smtp, setSmtp] = useState<SmtpSettings>({ host: "", port: 587, user: "", password: "", from: "hello@easysteperp.com", useSsl: true, fromAddresses: [] });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState({ subject: "", body: "", from: "" });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSmtp = useCallback(() => {
    api.admin.emailSettings().then(setSmtp).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadTemplates = useCallback(() => {
    api.admin.emailTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (tab === "smtp") loadSmtp();
    if (tab === "templates") {
      loadTemplates();
      loadSmtp(); // Şablonlar combobox üçün göndərən siyahısı
    }
  }, [tab, loadSmtp, loadTemplates]);

  const loadTemplate = useCallback((key: string) => {
    setSelectedTemplate(key);
    api.admin.getEmailTemplate(key).then((d) => setTemplateData({ subject: d.subject ?? "", body: d.body ?? "", from: d.from ?? "" })).catch(() => setTemplateData({ subject: "", body: "", from: "" }));
  }, []);

  const saveSmtp = async () => {
    setSmtpSaving(true);
    try {
      const payload = { ...smtp };
      if (!payload.password?.trim()) delete (payload as { password?: string }).password;
      await api.admin.putEmailSettings(payload);
      loadSmtp();
    } finally {
      setSmtpSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    setTemplateSaving(true);
    try {
      await api.admin.putEmailTemplate(selectedTemplate, templateData);
    } finally {
      setTemplateSaving(false);
    }
  };

  const sendBulk = async () => {
    const emails = bulkEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0 || !bulkSubject.trim() || !bulkBody.trim()) return;
    setBulkSending(true);
    setBulkResult(null);
    try {
      const r = await api.admin.bulkSendEmail({ emails, subject: bulkSubject, body: bulkBody });
      setBulkResult({ sent: r.sent ?? 0, failed: r.failed ?? 0 });
    } finally {
      setBulkSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">E-poçt ayarları</h1>

      <div className="flex gap-2 mb-6">
        {(["smtp", "templates", "bulk"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === t ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {t === "smtp" ? "SMTP" : t === "templates" ? "Şablonlar" : "Toplu göndərmə"}
          </button>
        ))}
      </div>

      {tab === "smtp" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-slate-900 mb-4">SMTP konfiqurasiyası</h2>
          <p className="text-sm text-slate-500 mb-4">Bu ayarlar appsettings-dəki SMTP dəyərlərini əvəz edir. Boş buraxılsa, appsettings istifadə olunur.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
              <input type="text" value={smtp.host} onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="smtp.example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
              <input type="number" value={smtp.port} onChange={(e) => setSmtp((s) => ({ ...s, port: parseInt(e.target.value, 10) || 587 }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İstifadəçi</label>
              <input type="text" value={smtp.user} onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="hello@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
              <input type="password" value={smtp.password} onChange={(e) => setSmtp((s) => ({ ...s, password: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Dəyişdirməmək üçün boş buraxın" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Varsayılan göndərən (From)</label>
              <input type="text" value={smtp.from} onChange={(e) => setSmtp((s) => ({ ...s, from: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="hello@easysteperp.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Göndərən ünvanları (şablonlar üçün)</label>
              <textarea value={smtp.fromAddresses?.join("\n") ?? ""} onChange={(e) => setSmtp((s) => ({ ...s, fromAddresses: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) }))} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" placeholder={"Hər sətirdə bir ünvan\nnoreply@easysteperp.com\nsecurity@easysteperp.com"} />
              <p className="text-xs text-slate-500 mt-1">Şablonlarda combobox-da bu ünvanlar göstəriləcək. Hər sətirdə bir e-poçt.</p>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={smtp.useSsl} onChange={(e) => setSmtp((s) => ({ ...s, useSsl: e.target.checked }))} className="rounded" />
              <span className="text-sm">SSL/TLS</span>
            </label>
          </div>
          <button onClick={saveSmtp} disabled={smtpSaving} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {smtpSaving ? "Saxlanılır..." : "Yadda saxla"}
          </button>
        </div>
      )}

      {tab === "templates" && (
        <div className="flex gap-6">
          <div className="w-64 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-medium text-slate-900">Şablonlar</div>
            <div className="max-h-96 overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => loadTemplate(t.key)}
                  className={`block w-full text-left px-4 py-3 text-sm ${selectedTemplate === t.key ? "bg-primary-50 text-primary-800" : "hover:bg-slate-50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6">
            {selectedTemplate ? (
              <>
                <h3 className="font-semibold text-slate-900 mb-4">Redaktə: {templates.find((t) => t.key === selectedTemplate)?.label}</h3>
                <p className="text-xs text-slate-500 mb-2">Şablon dəyişənləri: {"{{userName}}"} {"{{verifyUrl}}"} {"{{resetUrl}}"} {"{{code}}"} {"{{affiliatePanelUrl}}"} {"{{tenantName}}"} {"{{amount}}"} {"{{currency}}"} {"{{planName}}"} {"{{message}}"} {"{{year}}"} {"{{month}}"} {"{{customerCount}}"}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Göndərən</label>
                    <select value={templateData.from} onChange={(e) => setTemplateData((d) => ({ ...d, from: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                      <option value="">— SMTP varsayılanı —</option>
                      {[...new Set([smtp.from, ...(smtp.fromAddresses ?? [])].filter(Boolean))].map((addr) => (
                        <option key={addr} value={addr}>{addr}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">SMTP hissəsində təyin olunan ünvanlardan seçin</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mövzu</label>
                    <input type="text" value={templateData.subject} onChange={(e) => setTemplateData((d) => ({ ...d, subject: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mətn (HTML)</label>
                    <textarea value={templateData.body} onChange={(e) => setTemplateData((d) => ({ ...d, body: e.target.value }))} rows={14} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
                  </div>
                  <button onClick={saveTemplate} disabled={templateSaving} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {templateSaving ? "Saxlanılır..." : "Yadda saxla"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-slate-500">Soldan şablon seçin</p>
            )}
          </div>
        </div>
      )}

      {tab === "bulk" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-slate-900 mb-4">Toplu e-poçt göndərmə</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-poçtlar (vergüllü, nöqtəvergüllü və ya sətirə görə ayrılmış)</label>
              <textarea value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="email1@example.com, email2@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mövzu</label>
              <input type="text" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mətn (HTML)</label>
              <textarea value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} rows={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
            </div>
            {bulkResult && <p className="text-green-600">{bulkResult.sent} göndərildi, {bulkResult.failed} uğursuz</p>}
            <button onClick={sendBulk} disabled={bulkSending} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {bulkSending ? "Göndərilir..." : "Göndər"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
