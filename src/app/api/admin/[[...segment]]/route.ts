/**
 * Admin API proxy - /api/admin/* → backend
 */
import { NextRequest, NextResponse } from "next/server";
import { getApiBases, PROXY_TIMEOUT_MS } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function proxyReq(request: NextRequest, segment: string[], method: string) {
  const pathSegment = segment?.join("/") ?? "";
  const path = `/api/admin/${pathSegment}${request.nextUrl.search}`;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const auth = request.headers.get("Authorization");
  if (auth) headers.set("Authorization", auth);

  const body = method !== "GET" && method !== "HEAD" ? await request.text() : undefined;

  const bases = getApiBases();
  const MAX_RETRIES = 2; // fetch failed üçün təkrar cəhd
  const RETRY_DELAY_MS = 1500;

  for (const base of bases) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${base}${path}`, {
          method,
          headers,
          body: body ?? undefined,
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
        if (res.status === 404 || res.status === 502 || res.status === 503 || looksLikeError) break;
        return new NextResponse(data, { status: res.status, headers: { "Content-Type": contentType } });
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
  }

  return NextResponse.json(
    { message: "Backend API-ya çıxış yoxdur. www.easysteperp.com/api/ping yoxlayın." },
    { status: 502 }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  return proxyReq(req, (await params).segment ?? [], "GET");
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  return proxyReq(req, (await params).segment ?? [], "POST");
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  return proxyReq(req, (await params).segment ?? [], "PUT");
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  return proxyReq(req, (await params).segment ?? [], "PATCH");
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ segment?: string[] }> }) {
  return proxyReq(req, (await params).segment ?? [], "DELETE");
}
