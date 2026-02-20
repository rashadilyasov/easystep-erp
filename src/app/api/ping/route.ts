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
    authPing: null as unknown,
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

  // 2. Auth ping
  try {
    const pingRes = await fetch(`${base}/api/auth/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    results.authPing = {
      status: pingRes.status,
      body: await pingRes.text().catch(() => "(fail)"),
    };
  } catch (e) {
    results.authPing = { error: e instanceof Error ? e.message : String(e) };
  }

  // 3. Login (admin@easysteperp.com)
  let accessToken: string | null = null;
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
    if (loginRes.ok) {
      try {
        const parsed = JSON.parse(loginBody) as { accessToken?: string };
        accessToken = parsed.accessToken ?? null;
      } catch {
        /* ignore */
      }
    }
  } catch (e) {
    results.login = { error: e instanceof Error ? e.message : String(e) };
  }

  // 4. Admin tenants: birbaşa backend + proxy vasitəsilə
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.easysteperp.com";
  if (accessToken) {
    try {
      const directRes = await fetch(`${base}/api/admin/tenants`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      const directBody = await directRes.text().catch(() => "");
      results.adminTenantsDirect = {
        status: directRes.status,
        ok: directRes.ok,
        ...(directRes.status === 401 && directBody ? { body401: directBody.slice(0, 200) } : {}),
      };
    } catch (e) {
      results.adminTenantsDirect = { error: e instanceof Error ? e.message : String(e) };
    }
    try {
      const proxyRes = await fetch(`${origin}/api/admin/tenants`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      results.adminTenantsViaProxy = { status: proxyRes.status, ok: proxyRes.ok };
    } catch (e) {
      results.adminTenantsViaProxy = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    results.adminTenantsDirect = { error: "No token" };
    results.adminTenantsViaProxy = { error: "No token" };
  }

  return NextResponse.json(results, { status: 200 });
}
