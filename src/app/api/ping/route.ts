/**
 * Connectivity test — Railway API-ya çıxışı yoxlayır
 * GET /api/ping — cavabı brauzerdə görün
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.VERCEL ? "https://2qz1te51.up.railway.app" : "http://localhost:5000");
  const base = apiBase.replace(/\/$/, "");

  const results: Record<string, unknown> = {
    apiBase: base,
    timestamp: new Date().toISOString(),
    health: null as unknown,
    login: null as unknown,
    error: null as unknown,
  };

  // 1. Health
  try {
    const healthRes = await fetch(`${base}/api/Health`, { signal: AbortSignal.timeout(15000) });
    results.health = {
      status: healthRes.status,
      ok: healthRes.ok,
      body: await healthRes.text().catch(() => "(read failed)"),
    };
  } catch (e) {
    results.health = { error: e instanceof Error ? e.message : String(e) };
  }

  // 2. Login (admin@easysteperp.com)
  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@easysteperp.com", password: "Admin123!" }),
      signal: AbortSignal.timeout(15000),
    });
    const loginBody = await loginRes.text().catch(() => "(read failed)");
    results.login = {
      status: loginRes.status,
      ok: loginRes.ok,
      body: loginBody.length > 500 ? loginBody.slice(0, 500) + "..." : loginBody,
    };
  } catch (e) {
    results.login = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
