/**
 * Admin API proxy - /api/admin/* müraciətləri backend-ə yönləndirir.
 * Railway URL birinci (Health işləyən), 404/Application not found-da retry + növbəti base.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";
const API_CUSTOM_DOMAIN = "https://api.easysteperp.com";

function getApiBases(): string[] {
  const bases: string[] = [];
  const norm = (s: string) => s.replace(/\/$/, "").trim();
  const add = (u: string) => {
    const full = u.startsWith("http") ? u.replace(/\/$/, "") : `https://${u}`.replace(/\/$/, "");
    if (full && !bases.some((b) => norm(b) === norm(full))) bases.push(full);
  };
  add(API_CUSTOM_DOMAIN);
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) add(apiUrl);
  const pub = process.env.RAILWAY_PUBLIC_URL;
  if (pub) add(pub);
  if (process.env.VERCEL) add(RAILWAY_FALLBACK);
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function proxyReq(request: NextRequest, segment: string[], method: string) {
  const pathSegment = segment?.join("/") ?? "";
  const path = `/api/admin/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const auth = request.headers.get("Authorization");
  if (auth) headers.set("Authorization", auth);

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
