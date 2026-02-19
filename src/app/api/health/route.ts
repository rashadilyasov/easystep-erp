/**
 * Health proxy - explicit route to verify /api/health works.
 * Proxies to backend API.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.VERCEL ? "https://api.easysteperp.com" : "http://localhost:5000");
  const url = `${apiBase.replace(/\/$/, "")}/api/Health`;
  try {
    const res = await fetch(url);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: "API-ya çıxış yoxdur", backend: url },
      { status: 502 }
    );
  }
}
