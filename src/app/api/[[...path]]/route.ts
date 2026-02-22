/**
 * API proxy - bütün /api/* müraciətləri backend-ə yönləndirir.
 * Runtime-da API_URL oxunur, build-time constraint yoxdur.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Railway direct URL — api.easysteperp.com DNS/SSL problemlərində fallback
const RAILWAY_FALLBACK = "https://2qz1te51.up.railway.app";

function getApiBases(): string[] {
  const bases: string[] = [];
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    let u = url.replace(/\/$/, "").trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    bases.push(u);
  }
  const railPub = process.env.RAILWAY_PUBLIC_URL?.replace(/\/$/, "").trim();
  if (railPub && !bases.some((b) => b.replace(/\/$/, "") === railPub)) bases.push(railPub);
  if (process.env.VERCEL && !bases.includes(RAILWAY_FALLBACK)) bases.push(RAILWAY_FALLBACK);
  if (bases.length === 0) bases.push("http://localhost:5000");
  return bases;
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
  const bases = getApiBases();
  const pathWithQuery = `/api/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    if (k.toLowerCase() === "host" || k.toLowerCase() === "connection") return;
    headers.set(k, v);
  });
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let body: string | ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const ct = request.headers.get("content-type") || "";
    body = ct.includes("multipart/form-data") ? await request.arrayBuffer() : await request.text();
  }
  const hasBody = body != null && (typeof body === "string" ? body.length > 0 : body.byteLength > 0);

  let lastErr: Error | null = null;
  let lastRes: { data: string; status: number; contentType: string } | null = null;
  for (const apiBase of bases) {
    const url = `${apiBase}${pathWithQuery}`;
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: hasBody ? body : undefined,
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
      const data = await res.text();
      const contentType = res.headers.get("Content-Type") || "application/json";
      if (res.ok) {
        return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
      }
      lastRes = { data, status: res.status, contentType };
      if (res.status === 404 || res.status === 502 || data.toLowerCase().includes("application not found")) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[API Proxy] Base returned", res.status, apiBase.replace(/\/$/, ""), "– trying next…");
        }
        continue;
      }
      return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (typeof console !== "undefined" && console.error) {
        console.error("[API Proxy]", lastErr.message, { base: apiBase.replace(/\/$/, "") });
      }
    }
  }
  if (lastRes) {
    return new NextResponse(lastRes.data, { status: lastRes.status, headers: { "Content-Type": lastRes.contentType } });
  }

  const err = lastErr ?? new Error("Backend çatılmadı");
  const isTimeout = err.name === "TimeoutError" || err.message?.includes("timeout");
  return NextResponse.json(
    {
      message: isTimeout
        ? "API cavab vermədi (timeout). Bir az sonra yenidən cəhd edin."
        : "Backend API-ya çıxış yoxdur. www.easysteperp.com/api/ping açıb vəziyyəti yoxlayın.",
    },
    { status: 502 }
  );
}
