/**
 * Diaqnostik: /api/admin/ok — admin route-ların işləməsini yoxlayır
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, route: "api/admin/ok", timestamp: new Date().toISOString() });
}
