"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

function AttachmentDownloadLink({ id, fileName }: { id: string; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const base = "";
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${base}/api/support/attachments/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Yükləmə uğursuz");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Fayl yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button type="button" onClick={handleClick} disabled={loading} className="block text-primary-600 hover:underline text-sm text-left disabled:opacity-50">
      {fileName} {loading ? "(yüklənir...)" : ""}
    </button>
  );
}

type Ticket = { id: string; subject: string; status: string; date: string };
type TicketDetail = { id: string; subject: string; body: string; status: string; date: string; updatedAt: string };

const FAQ = [
  { q: "Quraşdırma necə edilir?", a: "Yükləmələr bölməsindən son versiyanı yükləyin və quraşdırıcını işə salın. Şəbəkə aktiv olmalıdır." },
  { q: "Ödəniş təsdiqi nə qədər çəkir?", a: "Payriff ödənişi adətən bir neçə saniyə ərzində təsdiqlənir. Webhook vasitəsilə abunə avtomatik aktivləşir." },
  { q: "Bir neçə cihazda istifadə oluna bilərmi?", a: "Bəli. Planınıza görə maksimum cihaz sayı müəyyən olunur. Lisenziyalar bölməsindən cihazları idarə edə bilərsiniz." },
  { q: "Texniki dəstək necə əldə edilər?", a: "Dəstək bölməsindən yeni bilet açın. Komandamız 1-2 iş günü ərzində cavab verir." },
];

export default function SupportContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; fileName: string; contentType: string; createdAt: string }[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.tickets.list().then(setTickets).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.tickets.create(subject.trim(), body.trim());
      const ticketId = (res as { id?: string }).id;
      if (ticketId && files.length > 0) {
        try {
          await api.tickets.addAttachments(ticketId, files);
        } catch (attErr) {
          const attMsg = attErr instanceof Error ? attErr.message : "Fayllar əlavə edilə bilmədi";
          alert(`Bilet açıldı, amma fayllar əlavə edilə bilmədi: ${attMsg}`);
        }
      }
      setModalOpen(false);
      setSubject("");
      setBody("");
      setFiles([]);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xəta baş verdi";
      alert(msg);
      if (typeof console !== "undefined" && console.error) console.error("[Support ticket]", e);
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    setDetailTicket(null);
    setAttachments([]);
    try {
      const [t, atts] = await Promise.all([
        api.tickets.get(ticketId),
        api.tickets.listAttachments(ticketId).catch(() => []),
      ]);
      setDetailTicket(t);
      setAttachments(atts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bilet açıla bilmədi";
      alert(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Bileti silmək istədiyinizə əminsiniz?")) return;
    setDeleting(ticketId);
    try {
      await api.tickets.delete(ticketId);
      setDetailTicket(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silinə bilmədi");
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (s: string) => {
    const c = s === "Resolved" || s === "Closed" ? "bg-green-100 text-green-800" : s === "InProgress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";
    const t = s === "Open" ? "Gözləyir" : s === "InProgress" ? "Həll edilir" : s === "Resolved" ? "Həll edildi" : "Bağlı";
    return <span className={`px-2 py-1 rounded text-xs ${c}`}>{t}</span>;
  };

  return (
    <div>
      <button
        onClick={() => setModalOpen(true)}
        className="mb-8 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
      >
        Yeni bilet aç
      </button>

      <div className="space-y-4">
        {loading ? (
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        ) : tickets.length === 0 ? (
          <p className="text-slate-500">Bilet tapılmadı. Yeni bilet açmaq üçün yuxarıdakı düyməni istifadə edin.</p>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t.id)}
              className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-primary-400 hover:shadow-md transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">#{t.id.slice(0, 8)} - {t.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">Açılış tarixi: {t.date}</p>
                  <div className="mt-2">{statusBadge(t.status)}</div>
                </div>
                <span className="text-slate-400 text-sm">Bax</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bilet detalları modal */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-slate-600">Yüklənir...</div>
        </div>
      )}
      {detailTicket && !detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailTicket(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-900 text-lg">#{detailTicket.id.slice(0, 8)} - {detailTicket.subject}</h3>
              <button onClick={() => setDetailTicket(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="mb-4">{statusBadge(detailTicket.status)}</div>
            <p className="text-sm text-slate-500 mb-2">Açılış: {detailTicket.date} · Son yenilənmə: {detailTicket.updatedAt}</p>
            <div className="prose prose-slate max-w-none mb-6">
              <p className="text-slate-700 whitespace-pre-wrap">{detailTicket.body}</p>
            </div>
            {attachments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Əlavə olunmuş fayllar</h4>
                <div className="space-y-1">
                  {attachments.map((a) => (
                    <AttachmentDownloadLink key={a.id} id={a.id} fileName={a.fileName} />
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => handleDelete(detailTicket.id)} disabled={!!deleting} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {deleting === detailTicket.id ? "Silinir..." : "Bileti sil"}
              </button>
              <button onClick={() => setDetailTicket(null)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Bağla</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-semibold text-slate-900 mb-4">Tez-tez verilən suallar</h3>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium text-slate-900">{f.q}</h4>
              <p className="text-slate-600 text-sm mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-slate-900 mb-4">Yeni bilet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mövzu</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
                  placeholder="Məs: Quraşdırma problemi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Təsvir</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 input-focus"
                  placeholder="Problemi təsvir edin..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fayl əlavə et (maks. 3 fayl, hər biri 5MB)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.log,.png,.jpg,.jpeg"
                  onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="w-full text-sm text-slate-600"
                />
                {files.length > 0 && <p className="text-xs text-slate-500 mt-1">{files.length} fayl seçildi</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={submitting || !subject.trim() || !body.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? "Göndərilir..." : "Göndər"}
                </button>
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                  Ləğv et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
