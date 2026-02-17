"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

type Ticket = { id: string; subject: string; status: string; date: string };

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
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.tickets.list().then(setTickets).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await api.tickets.create(subject.trim(), body.trim());
      setModalOpen(false);
      setSubject("");
      setBody("");
      load();
    } catch {
      alert("Xəta baş verdi");
    } finally {
      setSubmitting(false);
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
            <div key={t.id} className="p-6 bg-white rounded-2xl border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900">#{t.id.slice(0, 8)} — {t.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">Açılış tarixi: {t.date}</p>
                  <div className="mt-2">{statusBadge(t.status)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
