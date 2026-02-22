/**
 * Vahid API proxy konfiqurasiyası — bütün proxy route-lar eyni bazadan istifadə edir.
 * RAILWAY-ENV.md ilə uyğundur.
 */
const API_CUSTOM_DOMAIN = "https://api.easysteperp.com";
const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

export function getApiBases(): string[] {
  const bases: string[] = [];
  const norm = (s: string) => s.replace(/\/$/, "").trim();
  const add = (u: string) => {
    if (!u?.trim()) return;
    let full = u.replace(/\/$/, "").trim();
    if (!full.startsWith("http")) full = "https://" + full;
    if (full && !bases.some((b) => norm(b) === norm(full))) bases.push(full);
  };
  add(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "");
  add(API_CUSTOM_DOMAIN);
  add(process.env.RAILWAY_PUBLIC_URL || "");
  if (process.env.VERCEL) add(RAILWAY_FALLBACK);
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
}

export const PROXY_TIMEOUT_MS = 60000;
