"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STEPS = [
  "İlk quraşdırma",
  "Kontragentlər",
  "Materiallar",
  "Anbar",
  "Alış/Satış",
  "Pul uçotu",
  "Ekspeditor",
  "Hesabatlar",
];

export default function AcademyContent() {
  const [playlistId, setPlaylistId] = useState<string>("");
  const [materials, setMaterials] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    api.academy()
      .then((r) => setPlaylistId(r.youtubePlaylistId ?? ""))
      .catch(() => setPlaylistId(""));
  }, []);

  useEffect(() => {
    api.content.academyMaterials()
      .then((r) => setMaterials(Array.isArray(r) ? r : []))
      .catch(() => setMaterials([]));
  }, []);

  const embedUrl = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}`
    : null;

  return (
    <div>
      <div className="mb-8">
        <h3 className="font-semibold text-slate-900 mb-2">Yeni başlayanlar</h3>
        <p className="text-slate-600 text-sm mb-4">
          Təchizatçı üçün Easy Step ERP yol xəritəsi.
        </p>
        <div className="flex gap-2 flex-wrap">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {embedUrl ? (
          <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200">
            <iframe
              src={embedUrl}
              title="Easy Step ERP videoları"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200 p-6">
            <span className="text-slate-600 font-medium mb-2">Videodərslər</span>
            <span className="text-slate-500 text-sm text-center">
              YouTube playlist Railway Variables-da App__AcademyYoutubePlaylistId ilə konfiqurasiya edilməlidir.
            </span>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 p-6 bg-white">
          <span className="text-slate-600 font-medium mb-3 block">Əlavə materiallar</span>
          {materials.length === 0 ? (
            <span className="text-slate-500 text-sm">Admin Kontent bölməsindən PDF/link əlavə edə bilərsiniz.</span>
          ) : (
            <ul className="space-y-2">
              {materials.map((m, i) => (
                <li key={i}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
