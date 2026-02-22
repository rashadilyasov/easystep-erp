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
  const [smtpError, setSmtpError] = useState<string | null>(null);
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
  const [testEmail, setTestEmail] = useState("rashadilyasov@yahoo.com");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ sent: boolean; message: string } | null>(null);

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
    setSmtpError(null);
    try {
      const payload = { ...smtp };
      if (!payload.password?.trim()) delete (payload as { password?: string }).password;
      await api.admin.putEmailSettings(payload);
      loadSmtp();
    } catch (e) {
      setSmtpError(e instanceof Error ? e.message : "Xəta baş verdi");
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

  const directApiBase =
    (typeof window !== "undefined" && (process.env.NEXT_PUBLIC_API_URL || "https://2qz1te51.up.railway.app").replace(/\/$/, "")) || "";

  const fetchDirect = async (path: string, body: object) => {
    if (!directApiBase) return null;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const res = await fetch(`${directApiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text?.slice(0, 200) || res.statusText);
    return text ? JSON.parse(text) : {};
  };

  const runTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const email = testEmail.trim();
    try {
      let r: { sent?: boolean; message?: string } = { sent: false, message: "" };
      try {
        r = await api.admin.testEmail(email);
      } catch (proxyErr) {
        const msg = proxyErr instanceof Error ? proxyErr.message : "";
        if (msg.toLowerCase().includes("application not found") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("502")) {
          const direct = await fetchDirect("/api/admin/test-email", { to: email });
          if (direct) r = direct as { sent?: boolean; message?: string };
          else throw proxyErr;
        } else {
          throw proxyErr;
        }
      }
      setTestResult({ sent: r.sent ?? false, message: r.message ?? "" });
    } catch (e) {
      setTestResult({ sent: false, message: e instanceof Error ? e.message : "Xəta baş verdi" });
    } finally {
      setTestSending(false);
    }
  };

  const runSendPasswordReset = async () => {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const email = testEmail.trim();
    try {
      let r: { sent?: boolean; message?: string } = { sent: false, message: "" };
      try {
        r = await api.admin.sendPasswordReset(email);
      } catch (proxyErr) {
        const msg = proxyErr instanceof Error ? proxyErr.message : "";
        if (msg.toLowerCase().includes("application not found") || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("502")) {
          const direct = await fetchDirect("/api/admin/send-password-reset", { email });
          if (direct) r = direct as { sent?: boolean; message?: string };
          else throw proxyErr;
        } else {
          throw proxyErr;
        }
      }
      setTestResult({ sent: r.sent ?? false, message: r.message ?? "" });
    } catch (e) {
      setTestResult({ sent: false, message: e instanceof Error ? e.message : "Xəta baş verdi" });
    } finally {
      setTestSending(false);
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
          <p className="text-sm text-slate-500 mb-4">Parol yalnız admin paneldə saxlanılır. İlk dəfə və ya parolu dəyişdirmək üçün mütləq daxil edib saxlayın.</p>
          {smtpError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{smtpError}</div>}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Parol <span className="text-red-500">*</span></label>
              <input type="password" value={smtp.password} onChange={(e) => setSmtp((s) => ({ ...s, password: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Dəyişdirməmək üçün boş buraxın (yalnız əvvəldən saxlanılıbsa)" />
              <p className="text-xs text-slate-500 mt-1">Təhlükə üçün parol göstərilmir. Köhnə parolu saxlayıb saxlamaq üçün boş buraxın.</p>
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

          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">SMTP test</h3>
            <p className="text-sm text-slate-500 mb-3">SMTP saxlandıqdan sonra test edin. Şifrə sıfırlama üçün bu e-poçtla qeydiyyatda istifadəçi olmalıdır.</p>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="px-4 py-2 border border-slate-300 rounded-lg w-64"
              />
              <button onClick={runTestEmail} disabled={testSending} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                {testSending ? "…" : "Test e-poçt"}
              </button>
              <button onClick={runSendPasswordReset} disabled={testSending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {testSending ? "…" : "Şifrə sıfırlama göndər"}
              </button>
            </div>
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.sent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
                {testResult.message}
              </div>
            )}
          </div>
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
