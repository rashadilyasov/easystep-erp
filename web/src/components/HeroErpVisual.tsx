"use client";

import { useState, useEffect } from "react";

const FRAME_DURATION_MS = 4500;

const FRAME_MESSAGES = [
  "📊 Bir baxışda bütün rəqəmlər - qərar qəbulu sürətlənir",
  "💰 Borclu və borc - kimə nə qədər borc var, hamısı aydın",
  "📦 Real vaxtda anbar - hər malın harada olduğunu bilin",
  "🛡️ Hər addım qeyd olunur - etibarlı və təhlükəsiz",
  "💵 Kassa və bank - nə gəldi, nə çıxdı, bir ayda",
];

const SIDEBAR_ITEMS = ["Dashboard", "Kontragentlər", "Anbarlar", "Alış", "Satış", "Pul"] as const;

function Sidebar({ activeIndex }: { activeIndex: number }) {
  return (
    <>
      {/* Mobile: horizontal pills - sm:640px-dən kiçik ekranlarda, swipe to scroll */}
      <div className="sm:hidden relative">
        <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {SIDEBAR_ITEMS.map((item, i) => (
            <div key={item} className={`flex-shrink-0 py-2 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap snap-start ${i === activeIndex ? "bg-primary-500 text-white" : "text-slate-600 bg-slate-100"}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none sm:hidden" aria-hidden />
      </div>
      {/* Desktop: vertical sidebar - sm:640px-dən böyük ekranlarda */}
      <div className="hidden sm:block w-32 md:w-40 lg:w-48 flex-shrink-0 bg-white/80 backdrop-blur border-r border-slate-200/80 p-3 md:p-4">
        {SIDEBAR_ITEMS.map((item, i) => (
          <div key={item} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium ${i === activeIndex ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "text-slate-600 hover:bg-slate-100"}`}>
            <div className="w-5 h-5 rounded-lg bg-white/20" />
            {item}
          </div>
        ))}
      </div>
    </>
  );
}

const FRAMES = [
  {
    id: "dashboard",
    content: (
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-slate-50 to-white pb-12 md:pb-10 min-w-0">
        <Sidebar activeIndex={0} />
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 overflow-visible">
          <div className="h-10 md:h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-4 md:mb-5 flex items-center px-4 md:px-5 text-white font-semibold text-xs md:text-sm shadow-lg shadow-primary-500/25">
            Əsas Səhifə (Dashboard)
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 mb-4 md:mb-5 min-w-0">
            {[
              { label: "Satış (Cari ay)", value: "₼ 12 450", color: "from-primary-50 to-white", accent: "text-primary-600", trend: "+12%" },
              { label: "Satış (Bu gün)", value: "₼ 3 780", color: "from-emerald-50 to-white", accent: "text-emerald-600", trend: "↑" },
              { label: "Anbar qalığı", value: "₼ 28 920", color: "from-emerald-50 to-white", accent: "text-emerald-700 font-bold", trend: "" },
              { label: "Mənfəət (ay)", value: "₼ 8 640", color: "from-emerald-50 to-white", accent: "text-emerald-700 font-bold", trend: "+24%" },
            ].map((k) => (
              <div key={k.label} className={`p-3 sm:p-5 rounded-xl md:rounded-2xl border border-slate-200/80 bg-gradient-to-br ${k.color} shadow-md md:shadow-lg shadow-slate-200/50 min-w-0 overflow-hidden`}>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium truncate">{k.label}</div>
                <div className={`text-base sm:text-xl md:text-2xl font-extrabold mt-1 md:mt-2 truncate ${k.accent}`}>{k.value}</div>
                {k.trend && <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold">{k.trend}</span>}
              </div>
            ))}
          </div>
          <div className="h-28 md:h-32 rounded-xl md:rounded-2xl border border-slate-200/80 bg-white p-3 md:p-5 shadow-inner">
            <div className="text-xs md:text-sm font-medium text-slate-600 mb-2 md:mb-3">Son 6 ay (Satış vs Alış)</div>
            <div className="flex items-end gap-1 sm:gap-2 h-12 md:h-16">
              {[45, 72, 58, 85, 68, 92].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md md:rounded-t-lg min-h-[6px] shadow-md" style={{ height: `${h}%` }} />
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
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-slate-50 to-white pb-8 md:pb-8 min-w-0">
        <Sidebar activeIndex={1} />
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-10 md:h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-4 md:mb-5 flex items-center px-4 md:px-5 text-white font-semibold text-xs md:text-sm shadow-lg shadow-primary-500/25">Kontragentlər</div>
          <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200/80 overflow-hidden shadow-lg overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[280px]">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="text-left py-3 md:py-4 px-3 md:px-5 font-semibold text-slate-700">Müştəri / Təchizatçı</th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-5 font-semibold text-emerald-600">Borclu</th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-5 font-semibold text-amber-600">Borc</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "ABC MMC", borc: "₼ 2 450", mueyyen: "-" },
                  { name: "XYZ Ltd", borc: "-", mueyyen: "₼ 1 890" },
                  { name: "Trade Plus", borc: "₼ 5 120", mueyyen: "-" },
                ].map((r) => (
                  <tr key={r.name} className="border-t border-slate-100 hover:bg-primary-50/50">
                    <td className="py-3 md:py-4 px-3 md:px-5 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-3 md:py-4 px-3 md:px-5 text-right font-bold text-emerald-600">{r.borc}</td>
                    <td className="py-3 md:py-4 px-3 md:px-5 text-right font-bold text-amber-600">{r.mueyyen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 md:mt-4 px-3 md:px-4 py-2 bg-emerald-50 rounded-xl text-xs md:text-sm font-medium text-emerald-700 border border-emerald-200/60">
            Kimə nə qədər borc - bir baxışda
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "anbar",
    content: (
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-slate-50 to-white pb-8 md:pb-8 min-w-0">
        <Sidebar activeIndex={2} />
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-10 md:h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-4 md:mb-5 flex items-center px-4 md:px-5 text-white font-semibold text-xs md:text-sm shadow-lg shadow-primary-500/25">Anbar qalıqları</div>
          <div className="grid gap-3 md:gap-4">
            {[
              { name: "Material A", qty: "1 250", bir: "ədəd", value: "₼ 12 500", bar: 85 },
              { name: "Material B", qty: "890", bir: "kq", value: "₼ 8 900", bar: 60 },
              { name: "Material C", qty: "320", bir: "ədəd", value: "₼ 7 520", bar: 40 },
            ].map((r) => (
              <div key={r.name} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 p-2.5 sm:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-shadow min-w-0 overflow-hidden">
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-800 text-xs sm:text-base truncate">{r.name}</span>
                  <span className="text-[10px] sm:text-base font-bold text-primary-600 flex-shrink-0">{r.qty} {r.bir}</span>
                </div>
                <div className="flex-1 min-w-0 h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" style={{ width: `${r.bar}%` }} />
                </div>
                <div className="text-[10px] sm:text-base font-bold text-emerald-600 truncate">{r.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 md:mt-4 px-3 md:px-4 py-2 bg-primary-50 rounded-xl text-xs md:text-sm font-medium text-primary-700 border border-primary-200/60">
            Real vaxtda stok - hər an güncel məlumat
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "təhlükəsizlik",
    content: (
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-slate-50 to-white pb-8 md:pb-8 min-w-0">
        <Sidebar activeIndex={-1} />
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-10 md:h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl mb-4 md:mb-5 flex items-center px-4 md:px-5 text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-500/25">🛡️ Nəzarət və Təhlükəsizlik</div>
          <div className="space-y-3 md:space-y-4">
            {[
              { icon: "✓", text: "Hər əməliyyat tarixçəsi ilə qeyd olunur - şəffaflıq", color: "from-emerald-50 to-white" },
              { icon: "✓", text: "İstifadəçi rolları və icazələr - nəzarət", color: "from-emerald-50 to-white" },
              { icon: "✓", text: "OWASP ASVS standartlarına uyğun - etibarlılıq", color: "from-emerald-50 to-white" },
            ].map((item) => (
              <div key={item.text} className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border border-emerald-200/80 bg-gradient-to-r ${item.color} shadow-sm`}>
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 text-white text-lg md:text-xl font-bold shadow-md">{item.icon}</span>
                <span className="font-semibold text-slate-700 text-sm md:text-base">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 md:mt-4 px-3 md:px-4 py-2 bg-emerald-50 rounded-xl text-xs md:text-sm font-bold text-emerald-700 border border-emerald-200/60">
            Məlumatlarınız qorunur - 100% etibarlı
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "kassa",
    content: (
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-slate-50 to-white pb-8 md:pb-8 min-w-0">
        <Sidebar activeIndex={5} />
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-10 md:h-11 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl mb-4 md:mb-5 flex items-center px-4 md:px-5 text-white font-semibold text-xs md:text-sm shadow-lg shadow-primary-500/25">💵 Kassa və Ödənişlər</div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 md:mb-4">
            {[
              { label: "Kassa balansı", value: "₼ 15 840", color: "from-emerald-50", icon: "💵" },
              { label: "Bank balansı", value: "₼ 42 120", color: "from-emerald-50", icon: "🏦" },
              { label: "Bu gün mədaxil", value: "₼ 3 200", color: "from-white", icon: "↑" },
              { label: "Bu gün məxaric", value: "₼ 1 450", color: "from-white", icon: "↓" },
            ].map((k) => (
              <div key={k.label} className={`p-3 sm:p-5 rounded-xl md:rounded-2xl border border-slate-200/80 bg-gradient-to-br ${k.color} to-white shadow-md`}>
                <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{k.label}</div>
                <div className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-800 mt-1 md:mt-2 truncate">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="p-3 md:p-5 bg-gradient-to-r from-primary-50 to-emerald-50 rounded-xl md:rounded-2xl border border-primary-200/60">
            <div className="text-xs md:text-sm font-bold text-slate-700">Nə gəldi, nə çıxdı - hər şey aydın və nəzarətdə.</div>
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
    <div className="mt-6 md:mt-8 mx-auto max-w-5xl w-full min-w-0 px-1 sm:px-0 overflow-x-hidden">
      {/* Attention-grabbing message badge */}
      <div className="mb-3 md:mb-4 flex justify-center px-2">
        <div className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs md:text-sm font-semibold shadow-lg shadow-primary-500/30 animate-pulse-slow text-center">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          <span className="break-words">{FRAME_MESSAGES[frameIndex]}</span>
        </div>
      </div>

      <div
        className="relative rounded-3xl border-2 border-slate-200/80 overflow-hidden w-full max-w-full"
        style={{
          boxShadow: "0 30px 60px -15px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        {/* Premium top bar - kompakt mobil */}
        <div className="flex items-center flex-nowrap gap-1 sm:gap-2 sm:gap-3 px-2 sm:px-5 py-2 sm:py-3.5 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200/80 min-w-0 overflow-hidden">
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <div className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-red-400 shadow-sm" />
            <div className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-400 shadow-sm" />
            <div className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 shadow-sm" />
          </div>
          <div className="flex-1 min-w-0 mx-0.5 sm:mx-4 py-1 sm:py-2 px-1.5 sm:px-5 bg-white rounded-md sm:rounded-xl text-slate-600 text-[10px] sm:text-sm font-medium border border-slate-200/80 shadow-inner overflow-hidden whitespace-nowrap">
            Easy Step ERP
          </div>
          <div className="flex gap-0.5 sm:gap-1.5 flex-shrink-0">
            {FRAMES.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${i === frameIndex ? "bg-primary-500 scale-125 shadow-md" : "bg-slate-300"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-[480px] sm:min-h-[500px] md:min-h-[520px] overflow-y-auto overflow-x-hidden pb-4">
          {FRAMES.map((f, i) => (
            <div
              key={f.id}
              className={`absolute inset-0 overflow-y-auto overflow-x-hidden transition-all duration-500 ${i === frameIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-[0.98] pointer-events-none"}`}
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
