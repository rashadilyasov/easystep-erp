/**
 * Auth API proxy - explicit route for /api/auth/* to avoid catch-all 404 issues.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

function getApiBase(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    let u = url.replace(/\/$/, "").trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    return u;
  }
  return process.env.VERCEL ? (process.env.RAILWAY_PUBLIC_URL || RAILWAY_FALLBACK) : "http://localhost:5000";
}

async function proxyReq(request: NextRequest, segment: string[], method: string) {
  const pathSegment = segment?.join("/") ?? "";
  const apiBase = getApiBase();
  const url = `${apiBase}/api/auth/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    if (k.toLowerCase() === "host" || k.toLowerCase() === "connection") return;
    headers.set(k, v);
  });

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") body = await request.text();

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ?? undefined,
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { message: "Backend API-ya çıxış yoxdur" },
      { status: 502 }
    );
  }
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
