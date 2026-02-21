"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

type Release = {
  id: string;
  version: string;
  fileUrl: string;
  sha256: string | null;
  notes: string | null;
  isLatest: boolean;
  publishedAt: string;
};

const FALLBACK: Release[] = [
  { id: "1", version: "1.2.0", fileUrl: "#", sha256: "a1b2c3...", notes: "Yeni modullar, performans təkmilləşdirmələri", isLatest: true, publishedAt: "16.02.2026" },
  { id: "2", version: "1.1.0", fileUrl: "#", sha256: null, notes: null, isLatest: false, publishedAt: "01.01.2026" },
];

export default function DownloadsContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .downloads()
      .then((r) => (Array.isArray(r) && r.length > 0 ? r : FALLBACK))
      .then(setReleases)
      .catch(() => setReleases(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const list = releases.length > 0 ? releases : FALLBACK;

  const handleDownload = useCallback(
    async (releaseId: string) => {
      try {
        const { url } = await api.downloadUrl(releaseId);
        if (url) window.location.href = url;
      } catch {
        alert("Yükləmə linki alınmadı. Abunə vəziyyətinizi yoxlayın.");
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {list.map((r) => (
          <div
            key={r.id}
            className={`p-6 rounded-2xl border flex items-center justify-between ${
              r.isLatest ? "bg-white border-slate-200" : "bg-white border-slate-200 opacity-75"
            }`}
          >
            <div>
              <h3 className="font-semibold text-slate-900">
                Easy Step ERP v{r.version}
                {r.isLatest && <span className="ml-2 text-sm text-primary-600">• Son versiya</span>}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Windows (.exe) • {r.publishedAt}
              </p>
              {r.sha256 && <p className="text-xs text-slate-500 mt-1">SHA-256: {r.sha256}</p>}
            </div>
            <button
              onClick={() => handleDownload(r.id)}
              className={`px-4 py-2 rounded-lg font-medium ${
                r.isLatest
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              Yüklə
            </button>
          </div>
        ))}
      </div>

      {list[0]?.notes && (
        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
          <h4 className="font-medium text-slate-900 mb-2">Buraxılış qeydləri (v{list[0].version})</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{list[0].notes}</p>
        </div>
      )}
    </>
  );
}
