/**
 * API proxy — bütün /api/* müraciətləri backend-ə yönləndirir.
 * Runtime-da API_URL oxunur, build-time constraint yoxdur.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiBase(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    let u = url.replace(/\/$/, "").trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    return u;
  }
  if (process.env.VERCEL) return "https://a19hvpgi.up.railway.app";
  return "http://localhost:5000"; // lokaldə api default port
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
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (e) {
    console.error("[API Proxy]", e);
    return NextResponse.json(
      { message: "Backend API-ya çıxış yoxdur. API_URL yoxlayın." },
      { status: 502 }
    );
  }
}
