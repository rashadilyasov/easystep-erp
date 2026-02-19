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
    (process.env.VERCEL ? (process.env.RAILWAY_PUBLIC_URL || "https://2qz1te51.up.railway.app") : "http://localhost:5000");
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
