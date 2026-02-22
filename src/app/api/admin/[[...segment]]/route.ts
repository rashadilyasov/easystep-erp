/**
 * Admin API proxy - /api/admin/* müraciətləri backend-ə yönləndirir.
 * Railway URL birinci (Health işləyən), 404/Application not found-da retry + növbəti base.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RAILWAY_DIRECT = "https://2qz1te51.up.railway.app";
const API_CUSTOM_DOMAIN = "https://api.easysteperp.com";

function getApiBases(): string[] {
  const bases: string[] = [];
  const norm = (s: string) => s.replace(/\/$/, "").trim();
  if (process.env.VERCEL) {
    bases.push(RAILWAY_DIRECT);
    if (!bases.some((b) => norm(b) === API_CUSTOM_DOMAIN)) bases.push(API_CUSTOM_DOMAIN);
  }
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    const u = url.replace(/\/$/, "").trim();
    const full = u.startsWith("http") ? u : `https://${u}`;
    if (!bases.some((b) => norm(b) === norm(full))) bases.push(full);
  }
  const pub = process.env.RAILWAY_PUBLIC_URL?.replace(/\/$/, "").trim();
  if (pub && !bases.some((b) => norm(b) === pub)) bases.push(pub);
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function proxyReq(request: NextRequest, segment: string[], method: string) {
  const pathSegment = segment?.join("/") ?? "";
  const path = `/api/admin/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    if (["host", "connection"].includes(k.toLowerCase())) return;
    headers.set(k, v);
  });
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const body = method !== "GET" && method !== "HEAD" ? await request.text() : undefined;
  const bases = getApiBases();
  let lastRes: { data: string; status: number; contentType: string } | null = null;

  for (const base of bases) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `${base}${path}`;
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ?? undefined,
          signal: AbortSignal.timeout(25000),
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
          looksLikeErrorPage;
        if (isRetryable) {
          if (attempt === 0) {
            await sleep(2000);
            continue;
          }
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[Admin Proxy] Base returned", res.status, base.replace(/\/$/, ""), "– trying next…");
          }
          break;
        }
        return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
      } catch (e) {
        if (attempt === 0) {
          await sleep(1500);
          continue;
        }
        if (typeof console !== "undefined" && console.error) {
          console.error("[Admin Proxy]", (e instanceof Error ? e : new Error(String(e))).message, { base: base.replace(/\/$/, "") });
        }
        break;
      }
    }
  }

  if (lastRes) {
    return new NextResponse(lastRes.data, { status: lastRes.status, headers: { "Content-Type": lastRes.contentType } });
  }

  return NextResponse.json(
    { message: "Backend API-ya çıxış yoxdur. API_URL və Railway yoxlayın." },
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
