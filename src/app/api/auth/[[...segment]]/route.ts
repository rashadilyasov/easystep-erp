/**
 * Auth API proxy - explicit route for /api/auth/* to avoid catch-all 404 issues.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";
const API_CUSTOM_DOMAIN = "https://api.easysteperp.com";

function getApiBases(): string[] {
  const bases: string[] = [];
  const norm = (s: string) => s.replace(/\/$/, "").trim();
  const add = (u: string) => {
    const full = u.startsWith("http") ? u.replace(/\/$/, "") : `https://${u}`.replace(/\/$/, "");
    if (full && !bases.some((b) => norm(b) === norm(full))) bases.push(full);
  };
  // api.easysteperp.com birinci — ping göstərir işləyir
  add(API_CUSTOM_DOMAIN);
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) add(apiUrl);
  const pub = process.env.RAILWAY_PUBLIC_URL;
  if (pub) add(pub);
  if (process.env.VERCEL) add(RAILWAY_FALLBACK);
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
}

async function proxyReq(request: NextRequest, segment: string[], method: string) {
  const pathSegment = segment?.join("/") ?? "";
  const bases = getApiBases();
  const path = `/api/auth/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    if (["host", "connection"].includes(k.toLowerCase())) return;
    headers.set(k, v);
  });
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const body = method !== "GET" && method !== "HEAD" ? await request.text() : undefined;
  let lastErr: Error | null = null;
  let lastRes: { data: string; status: number; contentType: string } | null = null;

  for (const base of bases) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: AbortSignal.timeout(60000),
        cache: "no-store",
      });
      const data = await res.text();
      const contentType = res.headers.get("Content-Type") || "application/json";
      const looksLikeErrorPage =
        data.toLowerCase().includes("application not found") || data.toLowerCase().includes("dns_probe_finished_nxdomain");
      if (res.ok && !looksLikeErrorPage) {
        return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
      }
      lastRes = { data, status: res.status, contentType };
      const isRetryable =
        res.status === 404 ||
        res.status === 502 ||
        res.status === 503 ||
        data.toLowerCase().includes("application not found") ||
        data.toLowerCase().includes("dns_probe_finished_nxdomain");
      if (isRetryable) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[Auth Proxy] Base returned", res.status, base.replace(/\/$/, ""), "– trying next…");
        }
        continue;
      }
      return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (typeof console !== "undefined" && console.error) {
        console.error("[Auth Proxy]", lastErr.message, { base: base.replace(/\/$/, "") });
      }
    }
  }

  if (lastRes) {
    const isAppNotFound = lastRes.data?.toLowerCase().includes("application not found");
    if (isAppNotFound) {
      return NextResponse.json(
        { message: "API çatılmır. Vercel-da API_URL yoxlayın, www.easysteperp.com/api/ping açın." },
        { status: 502 }
      );
    }
    return new NextResponse(lastRes.data, {
      status: lastRes.status,
      headers: { "Content-Type": lastRes.contentType },
    });
  }

  return NextResponse.json(
    { message: "Backend API-ya çıxış yoxdur. API_URL və Railway yoxlayın. /api/ping." },
    { status: 502 }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  const { segment } = await params;
  return proxyReq(req, segment ?? [], "GET");
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  const { segment } = await params;
  return proxyReq(req, segment ?? [], "POST");
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  const { segment } = await params;
  return proxyReq(req, segment ?? [], "PUT");
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  const { segment } = await params;
  return proxyReq(req, segment ?? [], "PATCH");
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  const { segment } = await params;
  return proxyReq(req, segment ?? [], "DELETE");
}
