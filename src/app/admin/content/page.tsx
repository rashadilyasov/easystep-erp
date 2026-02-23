"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

function AdminAttachmentLink({ id, fileName }: { id: string; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`/api/admin/attachments/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
    <button type="button" onClick={onClick} disabled={loading} className="flex items-center gap-2 text-primary-600 hover:underline text-sm text-left disabled:opacity-50">
      📎 {fileName} {loading ? "(yüklənir...)" : ""}
    </button>
  );
}

type Announcement = { id: string; title: string; body: string; publishedAt: string; active?: boolean };
type Contact = { id: string; name: string; email: string; message: string; date: string };

function ContactMessageCard({ contact, onDeleted }: { contact: Contact; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [forwardModal, setForwardModal] = useState(false);
  const [forwardTo, setForwardTo] = useState("info@easysteperp.com");

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bu mesajı silmək istədiyinizə əminsiniz?")) return;
    setDeleting(true);
    try {
      await api.admin.deleteContact(contact.id);
      onDeleted();
      setOpen(false);
    } catch {
      alert("Silinə bilmədi");
    } finally {
      setDeleting(false);
    }
  };

  const handleForward = async () => {
    setForwarding(true);
    try {
      const res = await api.admin.forwardContact(contact.id, forwardTo.trim() || undefined);
      alert((res as { message?: string }).message ?? "Göndərildi");
      setForwardModal(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Göndərilə bilmədi");
    } finally {
      setForwarding(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="p-3 bg-slate-50 rounded-lg text-sm flex items-center justify-between gap-3 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 truncate">{contact.name} &lt;{contact.email}&gt;</div>
          <span className="text-slate-400 text-xs">{contact.date}</span>
        </div>
        <span className="text-slate-400 text-xs shrink-0">Bax</span>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-slate-900">{contact.name} &lt;{contact.email}&gt;</h4>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <p className="text-slate-500 text-xs mb-3">{contact.date}</p>
            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-6 border-t border-slate-200 pt-4">{contact.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForwardModal(true)}
                disabled={forwarding}
                className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50"
              >
                📧 E-poçta göndər
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                {deleting ? "..." : "Sil"}
              </button>
              <button onClick={() => setOpen(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
      {forwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setForwardModal(false)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-medium text-slate-900 mb-2">E-poçta göndər</h4>
            <input
              type="email"
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              placeholder="info@easysteperp.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleForward} disabled={forwarding} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50">
                {forwarding ? "Göndərilir..." : "Göndər"}
              </button>
              <button onClick={() => setForwardModal(false)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                Ləğv
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
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
  const [detailTicket, setDetailTicket] = useState<{ id: string; subject: string; body: string; status: string; date: string; tenantName: string; attachments?: { id: string; fileName: string; contentType: string; createdAt: string }[] } | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("ticketId");
    if (ticketId) {
      api.admin.ticket(ticketId).then((t) => setDetailTicket(t)).catch(() => {});
      window.history.replaceState({}, "", "/admin/content");
    }
  }, []);

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
              {contacts.slice(0, 20).map((c) => (
                <ContactMessageCard key={c.id} contact={c} onDeleted={() => load()} />
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
            {detailTicket.attachments && detailTicket.attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Əlavə olunmuş fayllar</h4>
                <div className="space-y-1">
                  {detailTicket.attachments.map((a) => (
                    <AdminAttachmentLink key={a.id} id={a.id} fileName={a.fileName} />
                  ))}
                </div>
              </div>
            )}
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
