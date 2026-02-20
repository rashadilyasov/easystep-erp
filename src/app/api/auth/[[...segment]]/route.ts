/**
 * Auth API proxy - explicit route for /api/auth/* to avoid catch-all 404 issues.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

function getApiBases(): string[] {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  const bases: string[] = [];
  if (url) {
    let u = url.replace(/\/$/, "").trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    bases.push(u);
  }
  if (process.env.VERCEL) {
    const pub = process.env.RAILWAY_PUBLIC_URL;
    if (pub && !bases.includes(pub.replace(/\/$/, ""))) bases.push(pub.replace(/\/$/, ""));
    if (!bases.includes(RAILWAY_FALLBACK)) bases.push(RAILWAY_FALLBACK);
  }
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

  for (const base of bases) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
      });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (typeof console !== "undefined" && console.error) {
        console.error("[Auth Proxy]", lastErr.message, { base: base.replace(/\/$/, "") });
      }
    }
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
