import { NextResponse } from "next/server";
import { runTool } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduled in vercel.json at 15:00 UTC, which is 9:00 am in Mexico City.
// Vercel Cron sends CRON_SECRET as a Bearer token. In this demo the digest is
// only composed; delivery by email is a planned integration.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const digest = runTool("resumen_del_dia", {});
  return NextResponse.json({
    delivered: false,
    reason: "Email delivery is disabled in the demo. See /integraciones/resumen-diario.",
    digest: digest?.text ?? "",
  });
}
