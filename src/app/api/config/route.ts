/**
 * Frontend üçün API base URL — proxy uğursuz olanda birbaşa Railway-a müraciət
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.RAILWAY_PUBLIC_URL ||
    (process.env.VERCEL ? "https://api.easysteperp.com" : "http://localhost:5000");
  return NextResponse.json({
    apiBase: apiBase.replace(/\/$/, ""),
  });
}
