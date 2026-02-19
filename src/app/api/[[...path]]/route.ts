/**
 * API proxy - bütün /api/* müraciətləri backend-ə yönləndirir.
 * Runtime-da API_URL oxunur, build-time constraint yoxdur.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Railway default — api.easysteperp.com DNS problemləri ola bilər
const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

function getApiBase(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    let u = url.replace(/\/$/, "").trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    return u;
  }
  if (process.env.VERCEL) return process.env.RAILWAY_PUBLIC_URL || RAILWAY_FALLBACK;
  return "http://localhost:5000";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "GET");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "POST");
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "PUT");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "DELETE");
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params, "HEAD");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

async function proxy(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
  method: string
) {
  const { path } = await params;
  const pathSegment = path?.join("/") ?? "";
  const apiBase = getApiBase();
  const url = `${apiBase}/api/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    if (k.toLowerCase() === "host" || k.toLowerCase() === "connection") return;
    headers.set(k, v);
  });

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

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
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[API Proxy]", err.message, { url: url.replace(/[?].*/, "") });
    const isTimeout = err.name === "TimeoutError" || err.message?.includes("timeout");
    return NextResponse.json(
      {
        message: isTimeout
          ? "API cavab vermədi (timeout). Bir az sonra yenidən cəhd edin."
          : "Backend API-ya çıxış yoxdur. API_URL və Railway statusunu yoxlayın.",
      },
      { status: 502 }
    );
  }
}
