"use client";

import { useState, useEffect } from "react";

const FRAME_DURATION_MS = 4500;

const FRAME_MESSAGES = [
  "📊 Bir baxışda bütün rəqəmlər — qərar qəbulu sürətlənir",
  "💰 Borclu və müəyyən — kimə nə qədər borc var, hamısı aydın",
  "📦 Real vaxtda anbar — hər malın harada olduğunu bilin",
  "🛡️ Hər addım qeyd olunur — etibarlı və təhlükəsiz",
  "💵 Kassa və bank — nə gəldi, nə çıxdı, bir ayda",
];

const FRAMES = [
  {
    id: "dashboard",
    content: (
      <div className="flex bg-gradient-to-br from-slate-50 to-white pb-8">
        <div className="w-40 md:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-4">
          {["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"].map((item, i) => (
            <div key={item} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium ${i === 0 ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-slate-600 hover:bg-slate-100"}`}>
              <div className="w-5 h-5 rounded-lg bg-white/20" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-5">
          <div className="h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-5 flex items-center px-5 text-white font-semibold text-sm shadow-lg shadow-primary-500/25">
            Əsas Səhifə (Dashboard)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Satış (Cari ay)", value: "₼ 12 450", color: "from-primary-50 to-white", accent: "text-primary-600", trend: "+12%" },
              { label: "Satış (Bu gün)", value: "₼ 3 780", color: "from-emerald-50 to-white", accent: "text-emerald-600", trend: "↑" },
              { label: "Anbar qalığı", value: "₼ 28 920", color: "from-emerald-50 to-white", accent: "text-emerald-700 font-bold", trend: "" },
              { label: "Mənfəət (ay)", value: "₼ 8 640", color: "from-emerald-50 to-white", accent: "text-emerald-700 font-bold", trend: "+24%" },
            ].map((k) => (
              <div key={k.label} className={`p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br ${k.color} shadow-lg shadow-slate-200/50`}>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{k.label}</div>
                <div className={`text-2xl md:text-3xl font-extrabold mt-2 ${k.accent}`}>{k.value}</div>
                {k.trend && <span className="text-xs text-emerald-600 font-semibold">{k.trend}</span>}
              </div>
            ))}
          </div>
          <div className="h-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-inner">
            <div className="text-sm font-medium text-slate-600 mb-3">Son 6 ay (Satış vs Alış)</div>
            <div className="flex items-end gap-2 h-14">
              {[45, 72, 58, 85, 68, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg min-h-[6px] shadow-md" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "kontragent",
    content: (
      <div className="flex bg-gradient-to-br from-slate-50 to-white pb-8">
        <div className="w-40 md:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-4">
          {["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"].map((item, i) => (
            <div key={item} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium ${i === 1 ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-slate-600"}`}>
              <div className="w-5 h-5 rounded-lg bg-white/20" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-5">
          <div className="h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-5 flex items-center px-5 text-white font-semibold text-sm shadow-lg shadow-primary-500/25">Kontragentlər</div>
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="text-left py-4 px-5 font-semibold text-slate-700">Müştəri / Təchizatçı</th>
                  <th className="text-right py-4 px-5 font-semibold text-emerald-600">Borclu</th>
                  <th className="text-right py-4 px-5 font-semibold text-amber-600">Müəyyən</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "ABC MMC", borc: "₼ 2 450", mueyyen: "—" },
                  { name: "XYZ Ltd", borc: "—", mueyyen: "₼ 1 890" },
                  { name: "Trade Plus", borc: "₼ 5 120", mueyyen: "—" },
                ].map((r) => (
                  <tr key={r.name} className="border-t border-slate-100 hover:bg-primary-50/50">
                    <td className="py-4 px-5 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-4 px-5 text-right font-bold text-emerald-600">{r.borc}</td>
                    <td className="py-4 px-5 text-right font-bold text-amber-600">{r.mueyyen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 px-4 py-2 bg-emerald-50 rounded-xl text-sm font-medium text-emerald-700 border border-emerald-200/60">
            Kimə nə qədər borc — bir baxışda
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "anbar",
    content: (
      <div className="flex bg-gradient-to-br from-slate-50 to-white pb-8">
        <div className="w-40 md:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-4">
          {["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"].map((item, i) => (
            <div key={item} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium ${i === 2 ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-slate-600"}`}>
              <div className="w-5 h-5 rounded-lg bg-white/20" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-5">
          <div className="h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-5 flex items-center px-5 text-white font-semibold text-sm shadow-lg shadow-primary-500/25">Anbar qalıqları</div>
          <div className="grid gap-4">
            {[
              { name: "Material A", qty: "1 250", bir: "ədəd", value: "₼ 12 500", bar: 85 },
              { name: "Material B", qty: "890", bir: "kq", value: "₼ 8 900", bar: 60 },
              { name: "Material C", qty: "320", bir: "ədəd", value: "₼ 7 520", bar: 40 },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow">
                <span className="font-semibold text-slate-800 min-w-[100px]">{r.name}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" style={{ width: `${r.bar}%` }} />
                </div>
                <span className="text-lg font-bold text-primary-600">{r.qty} {r.bir}</span>
                <span className="font-bold text-emerald-600">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 px-4 py-2 bg-primary-50 rounded-xl text-sm font-medium text-primary-700 border border-primary-200/60">
            Real vaxtda stok — hər an güncel məlumat
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "təhlükəsizlik",
    content: (
      <div className="flex bg-gradient-to-br from-slate-50 to-white pb-8">
        <div className="w-40 md:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-4">
          {["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"].map((item, i) => (
            <div key={item} className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium text-slate-600">
              <div className="w-5 h-5 rounded-lg bg-slate-300" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-5">
          <div className="h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl mb-5 flex items-center px-5 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25">🛡️ Nəzarət və Təhlükəsizlik</div>
          <div className="space-y-4">
            {[
              { icon: "✓", text: "Hər əməliyyat tarixçəsi ilə qeyd olunur — şəffaflıq", color: "from-emerald-50 to-white" },
              { icon: "✓", text: "İstifadəçi rolları və icazələr — nəzarət", color: "from-emerald-50 to-white" },
              { icon: "✓", text: "OWASP ASVS standartlarına uyğun — etibarlılıq", color: "from-emerald-50 to-white" },
            ].map((item) => (
              <div key={item.text} className={`flex items-center gap-4 p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-r ${item.color} shadow-sm`}>
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white text-xl font-bold shadow-md">{item.icon}</span>
                <span className="font-semibold text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 px-4 py-2 bg-emerald-50 rounded-xl text-sm font-bold text-emerald-700 border border-emerald-200/60">
            Məlumatlarınız qorunur — 100% etibarlı
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "kassa",
    content: (
      <div className="flex bg-gradient-to-br from-slate-50 to-white pb-8">
        <div className="w-40 md:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-4">
          {["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"].map((item, i) => (
            <div key={item} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium ${i === 5 ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-slate-600"}`}>
              <div className="w-5 h-5 rounded-lg bg-white/20" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-5">
          <div className="h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-5 flex items-center px-5 text-white font-semibold text-sm shadow-lg shadow-primary-500/25">💵 Kassa və Ödənişlər</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: "Kassa balansı", value: "₼ 15 840", color: "from-emerald-50", icon: "💵" },
              { label: "Bank balansı", value: "₼ 42 120", color: "from-emerald-50", icon: "🏦" },
              { label: "Bu gün mədaxil", value: "₼ 3 200", color: "from-white", icon: "↑" },
              { label: "Bu gün məxaric", value: "₼ 1 450", color: "from-white", icon: "↓" },
            ].map((k) => (
              <div key={k.label} className={`p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br ${k.color} to-white shadow-md`}>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{k.label}</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-2">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="p-5 bg-gradient-to-r from-primary-50 to-emerald-50 rounded-2xl border border-primary-200/60">
            <div className="text-sm font-bold text-slate-700">Nə gəldi, nə çıxdı — hər şey aydın və nəzarətdə.</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function HeroErpVisual() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setFrameIndex((i) => (i + 1) % FRAMES.length);
    }, FRAME_DURATION_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-6 md:mt-8 mx-auto max-w-5xl">
      {/* Attention-grabbing message badge */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/30 animate-pulse-slow">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {FRAME_MESSAGES[frameIndex]}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border-2 border-slate-200/80"
        style={{
          boxShadow: "0 30px 60px -15px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        {/* Premium top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200/80">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm" />
          </div>
          <div className="flex-1 mx-4 py-2 px-5 bg-white rounded-xl text-slate-600 text-sm font-medium border border-slate-200/80 shadow-inner">
            Easy Step ERP
          </div>
          <div className="flex gap-1.5">
            {FRAMES.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === frameIndex ? "bg-primary-500 scale-125 shadow-md" : "bg-slate-300 hover:bg-slate-400"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px] md:min-h-[480px]">
          {FRAMES.map((f, i) => (
            <div
              key={f.id}
              className={`absolute inset-0 transition-all duration-500 ${i === frameIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-[0.98]"}`}
            >
              {f.content}
            </div>
          ))}
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl opacity-30" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(37,99,235,0.02) 50%, transparent 100%)" }} />
      </div>
    </div>
  );
}
