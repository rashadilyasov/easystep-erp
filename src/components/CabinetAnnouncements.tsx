"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Announcement = { id: string; title: string; body: string; publishedAt: string; active?: boolean };

export default function CabinetAnnouncements() {
  const [list, setList] = useState<Announcement[]>([]);

  useEffect(() => {
    api.content.announcements()
      .then((r) => setList(Array.isArray(r) ? r : []))
      .catch(() => setList([]));
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-4">Elanlar</h3>
      <div className="space-y-3">
        {list.map((a) => (
          <div key={a.id} className="p-4 bg-slate-50 rounded-xl">
            <div className="font-medium text-slate-900">{a.title}</div>
            <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
            <span className="text-slate-400 text-xs">{a.publishedAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
