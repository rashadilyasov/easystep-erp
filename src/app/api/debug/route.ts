/**
 * Addım-addım diaqnostika — xətanın harada qırıldığını göstərir
 * GET /api/debug
 */
import { NextRequest, NextResponse } from "next/server";
import { getApiBases } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STEP = (name: string, fn: () => Promise<Record<string, unknown>>) => fn().then((r) => ({ step: name, ...r }));

export async function GET(req: NextRequest) {
  const base = getApiBases()[0] ?? "http://localhost:5000";
  const origin = req.nextUrl.origin;

  const steps: Record<string, unknown>[] = [];

  // 1. Birbaşa backend Health
  steps.push(
    await STEP("1_direct_backend_health", async () => {
      try {
        const t0 = Date.now();
        const r = await fetch(`${base}/api/Health`, { signal: AbortSignal.timeout(10000) });
        const body = await r.text();
        return { status: r.status, ok: r.ok, ms: Date.now() - t0, body: body.slice(0, 100), url: `${base}/api/Health` };
      } catch (e) {
        return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
      }
    })
  );

  // 2. Birbaşa backend auth/login
  steps.push(
    await STEP("2_direct_backend_login", async () => {
      try {
        const t0 = Date.now();
        const r = await fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@easysteperp.com", password: "Admin123!" }),
          signal: AbortSignal.timeout(15000),
        });
        const body = await r.text();
        const hasToken = r.ok && body.includes("accessToken");
        return { status: r.status, ok: r.ok, hasToken, ms: Date.now() - t0, url: `${base}/api/auth/login` };
      } catch (e) {
        return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
      }
    })
  );

  // 3. Proxy vasitəsilə auth/login (browser kimi)
  steps.push(
    await STEP("3_via_proxy_login", async () => {
      try {
        const t0 = Date.now();
        const r = await fetch(`${origin}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@easysteperp.com", password: "Admin123!" }),
          signal: AbortSignal.timeout(30000),
        });
        const body = await r.text();
        const hasToken = r.ok && body.includes("accessToken");
        return { status: r.status, ok: r.ok, hasToken, ms: Date.now() - t0, url: `${origin}/api/auth/login` };
      } catch (e) {
        return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
      }
    })
  );

  // 4. Birbaşa backend admin/ping (token ilə)
  let token: string | null = null;
  try {
    const loginR = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@easysteperp.com", password: "Admin123!" }),
      signal: AbortSignal.timeout(15000),
    });
    const loginBody = await loginR.text();
    if (loginR.ok) {
      const j = JSON.parse(loginBody) as { accessToken?: string };
      token = j.accessToken ?? null;
    }
  } catch {
    /* ignore */
  }

  steps.push(
    await STEP("4_direct_backend_admin_ping", async () => {
      if (!token) return { error: "No token from step 2" };
      try {
        const t0 = Date.now();
        const r = await fetch(`${base}/api/Admin/ping`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
        });
        const body = await r.text();
        return {
          status: r.status,
          ok: r.ok,
          ms: Date.now() - t0,
          body: body.slice(0, 80),
          url: `${base}/api/Admin/ping`,
        };
      } catch (e) {
        return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
      }
    })
  );

  // 5. api/admin/tenants (kiçik hərflə)
  if (token) {
    steps.push(
      await STEP("5_direct_admin_tenants_lowercase", async () => {
        try {
          const t0 = Date.now();
          const r = await fetch(`${base}/api/admin/tenants`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(15000),
          });
          const body = await r.text();
          return {
            status: r.status,
            ok: r.ok,
            ms: Date.now() - t0,
            bodyLen: body.length,
            url: `${base}/api/admin/tenants`,
          };
        } catch (e) {
          return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
        }
      })
    );

    steps.push(
      await STEP("6_direct_admin_tenants_uppercase", async () => {
        try {
          const t0 = Date.now();
          const r = await fetch(`${base}/api/Admin/tenants`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(15000),
          });
          const body = await r.text();
          return {
            status: r.status,
            ok: r.ok,
            ms: Date.now() - t0,
            bodyLen: body.length,
            url: `${base}/api/Admin/tenants`,
          };
        } catch (e) {
          return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
        }
      })
    );
  }

  // 7. Proxy vasitəsilə admin/tenants
  if (token) {
    steps.push(
      await STEP("7_via_proxy_admin_tenants", async () => {
        try {
          const t0 = Date.now();
          const r = await fetch(`${origin}/api/admin/tenants`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(30000),
          });
          return { status: r.status, ok: r.ok, ms: Date.now() - t0, url: `${origin}/api/admin/tenants` };
        } catch (e) {
          return { error: String(e), cause: (e as Error & { cause?: unknown }).cause?.toString() };
        }
      })
    );
  }

  return NextResponse.json({
    base,
    origin,
    timestamp: new Date().toISOString(),
    steps,
    summary: steps
      .map((s) => `${(s as { step?: string }).step}: ${"ok" in s && s.ok ? "OK" : "error" in s ? s.error : "fail"}`)
      .join(" | "),
  });
}
