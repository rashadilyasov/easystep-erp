"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Announcement = { id: string; title: string; body: string; publishedAt: string; active?: boolean };
type Contact = { id: string; name: string; email: string; message: string; date: string };
type Ticket = { id: string; subject: string; status: string; date: string; tenantName: string; body?: string };

function AcademyMaterialsSection() {
  const [list, setList] = useState<{ title: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const fetchList = useCallback(() => {
    setLoading(true);
    api.admin.academyMaterials()
      .then((r) => setList(Array.isArray(r) ? r : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setCreating(true);
    try {
      await api.admin.createAcademyMaterial(title.trim(), url.trim());
      setTitle("");
      setUrl("");
      setShowForm(false);
      fetchList();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm("Bu materialı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.admin.deleteAcademyMaterial(index);
      fetchList();
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <h4 className="font-medium text-slate-800 mb-2">Əlavə materiallar (PDF, link)</h4>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
        >
          + Material əlavə et
        </button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-2 mb-3 p-3 bg-slate-50 rounded-lg">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlıq"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            required
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (https://...)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm">
              {creating ? "..." : "Əlavə et"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setTitle(""); setUrl(""); }} className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm">
              Ləğv
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="h-12 bg-slate-100 rounded animate-pulse mt-2" />
      ) : list.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {list.map((m, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">{m.title}</a>
              <button type="button" onClick={() => handleDelete(i)} className="text-red-600 hover:text-red-700 text-xs shrink-0">Sil</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AnnouncementsSection() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const fetchList = useCallback(() => {
    setLoading(true);
    api.admin.announcements()
      .then((r) => setList(Array.isArray(r) ? r : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    try {
      await api.admin.createAnnouncement(title.trim(), body.trim());
      setTitle("");
      setBody("");
      setShowForm(false);
      fetchList();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu elanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.admin.deleteAnnouncement(id);
      fetchList();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <h3 className="font-semibold text-slate-900 mb-4">Elanlar</h3>
      <p className="text-slate-600 text-sm mb-4">Müştərilər kabinetdə bu elanları görəcək.</p>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
        >
          + Elan əlavə et
        </button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-3 mb-4 p-4 bg-slate-50 rounded-lg">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mövzu"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mətn"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {creating ? "..." : "Əlavə et"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setTitle(""); setBody(""); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
              Ləğv
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="h-16 bg-slate-100 rounded animate-pulse" />
      ) : list.length === 0 ? (
        <p className="text-slate-500 text-sm">Elan yoxdur</p>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="p-3 bg-slate-50 rounded-lg text-sm flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900">{a.title}</div>
                <div className="text-slate-600 truncate">{a.body}</div>
                <span className="text-slate-400 text-xs">{a.publishedAt}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="text-red-600 hover:text-red-700 text-xs shrink-0"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const TICKET_STATUSES: { value: string; label: string }[] = [
  { value: "Open", label: "Gözləyir" },
  { value: "InProgress", label: "Həll edilir" },
  { value: "Resolved", label: "Həll edildi" },
  { value: "Closed", label: "Bağlı" },
];

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
            YouTube playlist: Railway Variables-da <code className="bg-slate-100 px-1 rounded">App__AcademyYoutubePlaylistId</code> əlavə edin (məs: PLxxxxxxxx). Sonra Redeploy edin.
          </p>
          <AcademyMaterialsSection />
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
                      <option key={s.value} value={s.value}>{s.label}</option>
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
          <AnnouncementsSection />
        </div>
      </div>
      {detailTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-auto">
            <h3 className="font-semibold text-slate-900 mb-2">{detailTicket.subject}</h3>
            <p className="text-slate-500 text-xs mb-3">{detailTicket.tenantName} • {detailTicket.date} • {TICKET_STATUSES.find((s) => s.value === detailTicket.status)?.label ?? detailTicket.status}</p>
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
                <option key={s.value} value={s.value}>{s.label}</option>
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
