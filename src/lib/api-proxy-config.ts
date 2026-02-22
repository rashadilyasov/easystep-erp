/**
 * Vahid API proxy konfiqurasiyası — bütün proxy route-lar eyni bazadan istifadə edir.
 * RAILWAY-ENV.md ilə uyğundur.
 */
const API_CUSTOM_DOMAIN = "https://api.easysteperp.com";

/** 404/qeyri-funksional olduğu məlum olan base-lər — siyahıdan çıxarılır */
const EXCLUDED_BASES = ["2qz1te51.up.railway.app"];

export function getApiBases(): string[] {
  const bases: string[] = [];
  const norm = (s: string) => s.replace(/\/$/, "").trim().toLowerCase();
  const isExcluded = (u: string) => EXCLUDED_BASES.some((ex) => norm(u).includes(ex.toLowerCase()));
  const add = (u: string) => {
    if (!u?.trim() || isExcluded(u)) return;
    let full = u.replace(/\/$/, "").trim();
    if (!full.startsWith("http")) full = "https://" + full;
    if (full && !bases.some((b) => norm(b) === norm(full))) bases.push(full);
  };
  add(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "");
  add(API_CUSTOM_DOMAIN);
  add(process.env.RAILWAY_PUBLIC_URL || "");
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
}

export const PROXY_TIMEOUT_MS = 60000;
