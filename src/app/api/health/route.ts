/**
 * Health proxy - explicit route to verify /api/health works.
 * Proxies to backend API.
 */
import { NextResponse } from "next/server";
import { getApiBases } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const bases = getApiBases();
  for (const base of bases) {
    const url = `${base}/api/Health`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const data = await res.text();
      if (res.ok) {
        return new NextResponse(data, {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      continue;
    }
  }
  return NextResponse.json(
    { status: "error", message: "API-ya çıxış yoxdur", tried: bases },
    { status: 502 }
  );
}
