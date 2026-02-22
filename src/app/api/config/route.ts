/**
 * Frontend üçün API base URL — proxy uğursuz olanda birbaşa Railway-a müraciət
 */
import { NextResponse } from "next/server";
import { getApiBases } from "@/lib/api-proxy-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const bases = getApiBases();
  return NextResponse.json({ apiBase: bases[0] ?? "", apiBases: bases });
}
