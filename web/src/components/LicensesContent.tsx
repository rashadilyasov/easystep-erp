"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

type LicenseData = {
  activeDevices: number;
  maxDevices: number;
  devices: { id: string; name: string; lastSeen: string; fingerprint: string; status: number }[];
};

export default function LicensesContent() {
  const [data, setData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .licenses()
      .then(setData)
      .catch(() =>
        setData({
          activeDevices: 2,
          maxDevices: 5,
          devices: [
            { id: "1", name: "Windows PC — İş masası", lastSeen: "16.02.2026 15:30", fingerprint: "a8f3b2...", status: 0 },
            { id: "2", name: "Windows PC — Laptop", lastSeen: "14.02.2026 10:15", fingerprint: "c4d9e1...", status: 0 },
          ],
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const d =
    data ??
    ({ activeDevices: 0, maxDevices: 5, devices: [] } as LicenseData);

  const revoke = useCallback(
    async (id: string) => {
      if (!confirm("Bu cihazı deaktiv etmək istədiyinizə əminsiniz?")) return;
      try {
        await api.revokeDevice(id);
        setData((prev) =>
          prev
            ? {
                ...prev,
                devices: prev.devices.map((x) =>
                  x.id === id ? { ...x, status: 1 } : x
                ),
                activeDevices: Math.max(0, prev.activeDevices - 1),
              }
            : null
        );
      } catch {
        alert("Xəta baş verdi");
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 p-4 bg-slate-100 rounded-xl">
        <p className="text-sm text-slate-700">
          Aktiv cihazlar: <strong>{d.activeDevices}</strong> / {d.maxDevices} (maksimum)
        </p>
      </div>

      <div className="space-y-4">
        {d.devices.length === 0 ? (
          <p className="text-slate-600">Qeydiyyatda olan cihaz yoxdur.</p>
        ) : (
          d.devices.map((dev) => (
            <div
              key={dev.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{dev.name}</h3>
                <p className="text-sm text-slate-600">Son aktivlik: {dev.lastSeen}</p>
                <p className="text-xs text-slate-500 font-mono">FP: {dev.fingerprint}</p>
              </div>
              {dev.status === 0 && (
                <button
                  onClick={() => revoke(dev.id)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm"
                >
                  Deaktiv et
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
