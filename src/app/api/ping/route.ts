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

  // 4. Admin tenants (auth tələb olunur)
  if (accessToken) {
    try {
      const tenantsRes = await fetch(`${base}/api/admin/tenants`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      const body = await tenantsRes.text().catch(() => "");
      results.adminTenants = {
        status: tenantsRes.status,
        ok: tenantsRes.ok,
        ...(tenantsRes.status === 401 && body ? { body401: body.slice(0, 300) } : {}),
      };
    } catch (e) {
      results.adminTenants = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    results.adminTenants = { error: "No accessToken from login" };
  }

  return NextResponse.json(results, { status: 200 });
}
