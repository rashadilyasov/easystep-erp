"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Contact = { id: string; name: string; email: string; message: string; date: string };
type Ticket = { id: string; subject: string; status: string; date: string; tenantName: string; body?: string };

const TICKET_STATUSES = ["Open", "InProgress", "Resolved", "Closed"] as const;

export default function Content() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<{ id: string; subject: string; body: string; status: string; date: string; tenantName: string } | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.admin.contacts().catch(() => []),
      api.admin.tickets().catch(() => []),
    ]).then(([c, t]) => {
      setContacts(Array.isArray(c) ? c : []);
      setTickets(Array.isArray(t) ? t : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (ticketId: string) => {
    try {
      const t = await api.admin.ticket(ticketId);
      setDetailTicket(t);
    } catch {
      // ignore
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    setUpdating(ticketId);
    try {
      await api.admin.updateTicketStatus(ticketId, status);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Kontent idarəçiliyi</h1>
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Tutoriallar (Akademiya)</h3>
          <p className="text-slate-600 text-sm mb-4">
            YouTube playlist: appsettings.json → App:AcademyYoutubePlaylistId
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Biletlər</h3>
          {loading ? (
            <div className="h-24 bg-slate-100 rounded animate-pulse" />
          ) : tickets.length === 0 ? (
            <p className="text-slate-500 text-sm">Bilet yoxdur</p>
          ) : (
            <div className="space-y-2">
              {tickets.slice(0, 10).map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-lg text-sm flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openDetail(t.id)}
                    className="text-left flex-1 min-w-0"
                  >
                    <span className="font-medium hover:text-primary-600">{t.subject}</span>
                    <span className="text-slate-500 text-xs ml-2">• {t.tenantName} • {t.date}</span>
                  </button>
                  <select
                    value={t.status}
                    disabled={!!updating}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="text-sm border border-slate-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Son əlaqə mesajları</h3>
          {loading ? (
            <div className="h-24 bg-slate-100 rounded animate-pulse" />
          ) : contacts.length === 0 ? (
            <p className="text-slate-500 text-sm">Mesaj yoxdur</p>
          ) : (
            <div className="space-y-3">
              {contacts.slice(0, 10).map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="font-medium text-slate-900">{c.name} &lt;{c.email}&gt;</div>
                  <p className="text-slate-600 mt-1">{c.message}</p>
                  <span className="text-slate-400 text-xs">{c.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Elanlar</h3>
          <p className="text-slate-600 text-sm mb-4">Müştərilər üçün elanlar (tezliklə).</p>
        </div>
      </div>
      {detailTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-auto">
            <h3 className="font-semibold text-slate-900 mb-2">{detailTicket.subject}</h3>
            <p className="text-slate-500 text-xs mb-3">{detailTicket.tenantName} • {detailTicket.date} • {detailTicket.status}</p>
            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-4">{detailTicket.body}</p>
            <select
              value={detailTicket.status}
              disabled={!!updating}
              onChange={(e) => {
                updateStatus(detailTicket.id, e.target.value);
                setDetailTicket((prev) => prev ? { ...prev, status: e.target.value } : null);
              }}
              className="text-sm border border-slate-300 rounded px-2 py-1 bg-white disabled:opacity-50 mb-4"
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div>
              <button
                onClick={() => setDetailTicket(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
