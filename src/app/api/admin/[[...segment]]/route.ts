/**
 * Admin API proxy - explicit route for /api/admin/* to avoid catch-all 404.
 * Auth proxy ilə eyni prinsip — tenants/delete və digər admin route-lar.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

function getApiBases(): string[] {
  const bases: string[] = [];
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    const u = url.replace(/\/$/, "").trim();
    bases.push(u.startsWith("http") ? u : `https://${u}`);
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

  for (const base of bases) {
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
      return new NextResponse(data, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
      });
    } catch (e) {
      if (typeof console !== "undefined" && console.error) {
        console.error("[Admin Proxy]", (e instanceof Error ? e : new Error(String(e))).message, { base: base.replace(/\/$/, "") });
      }
    }
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
