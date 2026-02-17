"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  currency: string;
  maxDevices: number | null;
  isActive: boolean;
  createdAt: string;
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "",
    durationMonths: 12,
    price: 0,
    currency: "AZN",
    maxDevices: 5,
    isActive: true,
  });

  const load = useCallback(() => {
    api.admin
      .plans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({
      name: "",
      durationMonths: 12,
      price: 0,
      currency: "AZN",
      maxDevices: 5,
      isActive: true,
    });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: Plan) => {
    setForm({
      name: p.name,
      durationMonths: p.durationMonths,
      price: p.price,
      currency: p.currency,
      maxDevices: p.maxDevices ?? 5,
      isActive: p.isActive,
    });
    setEditing(p);
    setModal("edit");
  };

  const submitCreate = async () => {
    if (!form.name || form.price <= 0) return;
    try {
      await api.admin.createPlan({
        name: form.name,
        durationMonths: form.durationMonths,
        price: form.price,
        currency: form.currency,
        maxDevices: form.maxDevices || undefined,
      });
      setModal(null);
      load();
    } catch {
      // ignore
    }
  };

  const submitEdit = async () => {
    if (!editing || !form.name || form.price <= 0) return;
    try {
      await api.admin.updatePlan(editing.id, {
        name: form.name,
        durationMonths: form.durationMonths,
        price: form.price,
        currency: form.currency,
        maxDevices: form.maxDevices || undefined,
        isActive: form.isActive,
      });
      setModal(null);
      setEditing(null);
      load();
    } catch {
      // ignore
    }
  };

  const remove = async (planId: string) => {
    if (!confirm("Plan silinsin / deaktivləşdirilsin?")) return;
    try {
      await api.admin.deletePlan(planId);
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Planlar</h1>
      <button
        onClick={openCreate}
        className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Yeni plan
      </button>

      {loading ? (
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      ) : plans.length === 0 ? (
        <p className="text-slate-500">Plan yoxdur</p>
      ) : (
        <div className="space-y-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center ${
                !p.isActive ? "opacity-60" : ""
              }`}
            >
              <div>
                <span className="font-medium">
                  {p.name} — {p.price} {p.currency}
                </span>
                {!p.isActive && (
                  <span className="ml-2 text-xs text-amber-600">(deaktiv)</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="text-slate-600 hover:text-slate-900 text-sm"
                >
                  Redaktə
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {modal === "create" ? "Yeni plan" : "Plan redaktə"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Ad</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Əla 12 ay"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Müddət (ay)</label>
                  <input
                    type="number"
                    value={form.durationMonths}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, durationMonths: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Qiymət</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Valyuta</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Max cihaz</label>
                  <input
                    type="number"
                    value={form.maxDevices}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxDevices: parseInt(e.target.value) || null }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              {modal === "edit" && editing && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                    />
                    <span className="text-sm">Aktiv</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() =>
                  modal === "create" ? submitCreate() : submitEdit()
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Saxla
              </button>
              <button
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
