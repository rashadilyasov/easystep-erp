/**
 * API proxy - /api/* (auth və admin istisna) → backend
 */
import { NextRequest, NextResponse } from "next/server";
import { getApiBases, PROXY_TIMEOUT_MS } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function proxy(request: NextRequest, params: Promise<{ path?: string[] }>, method: string) {
  const { path } = await params;
  const pathSegment = path?.join("/") ?? "";
  const pathWithQuery = `/api/${pathSegment}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const auth = request.headers.get("Authorization");
  if (auth) headers.set("Authorization", auth);

  let body: string | ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const ct = request.headers.get("content-type") || "";
    body = ct.includes("multipart/form-data") ? await request.arrayBuffer() : await request.text();
  }
  const hasBody = body != null && (typeof body === "string" ? body.length > 0 : body.byteLength > 0);

  for (const base of getApiBases()) {
    try {
      const res = await fetch(`${base}${pathWithQuery}`, {
        method,
        headers,
        body: hasBody ? body : undefined,
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
        cache: "no-store",
      });
      const data = await res.text();
      const contentType = res.headers.get("Content-Type") || "application/json";
      const looksLikeError =
        data.toLowerCase().includes("application not found") || data.toLowerCase().includes("dns_probe_finished_nxdomain");
      if (res.ok && !looksLikeError) {
        return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
      }
      if (res.status === 404 || res.status === 502 || res.status === 503 || looksLikeError) continue;
      return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { message: "Backend API-ya çıxış yoxdur. www.easysteperp.com/api/ping yoxlayın." },
    { status: 502 }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "GET");
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "POST");
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "PUT");
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "PATCH");
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "DELETE");
}
export async function HEAD(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, "HEAD");
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
