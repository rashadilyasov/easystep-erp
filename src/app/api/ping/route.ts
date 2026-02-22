/**
 * Connectivity test — Railway API-ya çıxışı yoxlayır
 * GET /api/ping — cavabı brauzerdə görün
 */
import { NextRequest, NextResponse } from "next/server";
import { getApiBases } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIMEOUT_MS = 15000;

export async function GET(req: NextRequest) {
  const bases = getApiBases();
  const base = bases[0] ?? "http://localhost:5000";

  // Proxy test üçün origin: production domain (Vercel preview-dən qaçmaq üçün)
  const vercelHost = (process.env.VERCEL_URL || "").replace(/^https?:\/\//, "");
  const origin =
    vercelHost && !vercelHost.includes("easysteperp.com")
      ? "https://www.easysteperp.com"
      : vercelHost
        ? `https://${vercelHost}`
        : "https://www.easysteperp.com";

  const results: Record<string, unknown> = {
    apiBase: base,
    apiBases: bases,
    origin,
    timestamp: new Date().toISOString(),
    health: null as unknown,
    authPing: null as unknown,
    login: null as unknown,
    error: null as unknown,
  };

  // 1. Health
  try {
    const healthRes = await fetch(`${base}/api/Health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
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

  // 3b. Admin route diaqnostika — /api/admin/ok (Next.js route)
  try {
    const okRes = await fetch(`${origin}/api/admin/ok`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const okBody = await okRes.text().catch(() => "");
    results.adminRouteOk = {
      status: okRes.status,
      ok: okRes.ok,
      body: okBody.slice(0, 200),
    };
  } catch (e) {
    results.adminRouteOk = { error: e instanceof Error ? e.message : String(e) };
  }

  // 3c. Backend admin/ping — yüngül endpoint (DB yoxdur), route işləyir‑mi
  if (accessToken) {
    try {
      const bpRes = await fetch(`${base}/api/admin/ping`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      const bpBody = await bpRes.text().catch(() => "");
      results.adminPingBackend = { status: bpRes.status, ok: bpRes.ok, body: bpBody.slice(0, 150) };
    } catch (e) {
      results.adminPingBackend = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    results.adminPingBackend = { error: "No token" };
  }

  // 4. Admin tenants: birbaşa (hamısı base-lərə) + proxy vasitəsilə
  // Admin/tenants daha ağır sorğu olduğu üçün 30s timeout
  const ADMIN_TIMEOUT_MS = 30000;
  if (accessToken) {
    const authHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // Direct — bütün base-ləri sınaqdan keçir
    let directOk = false;
    const directResults: Record<string, unknown>[] = [];
    for (const b of bases) {
      try {
        const res = await fetch(`${b}/api/admin/tenants`, {
          headers: authHeaders,
          signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
          cache: "no-store",
        });
        const body = await res.text().catch(() => "");
        directResults.push({
          base: b,
          status: res.status,
          ok: res.ok,
          ...(res.status === 401 && body ? { body401: body.slice(0, 200) } : {}),
        });
        if (res.ok) directOk = true;
      } catch (e) {
        directResults.push({ base: b, error: e instanceof Error ? e.message : String(e) });
      }
    }
    results.adminTenantsDirect = directOk
      ? { ok: true, firstSuccess: directResults.find((r) => r.ok) }
      : { ok: false, attempts: directResults };

    // Proxy — origin üzərindən Next.js /api/admin/tenants
    try {
      const proxyUrl = `${origin}/api/admin/tenants`;
      const proxyRes = await fetch(proxyUrl, {
        headers: authHeaders,
        signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
        cache: "no-store",
      });
      const proxyBody = await proxyRes.text().catch(() => "");
      results.adminTenantsViaProxy = {
        status: proxyRes.status,
        ok: proxyRes.ok,
        url: proxyUrl,
        ...(proxyRes.status === 404 && proxyBody ? { body: proxyBody.slice(0, 300) } : {}),
        ...(proxyRes.status === 401 && proxyBody ? { body401: proxyBody.slice(0, 300) } : {}),
      };
    } catch (e) {
      results.adminTenantsViaProxy = {
        error: e instanceof Error ? e.message : String(e),
        url: `${origin}/api/admin/tenants`,
      };
    }
  } else {
    results.adminTenantsDirect = { error: "No token" };
    results.adminTenantsViaProxy = { error: "No token" };
  }

  return NextResponse.json(results, { status: 200 });
}
