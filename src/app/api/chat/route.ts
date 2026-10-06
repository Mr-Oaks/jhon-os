import { NextResponse } from "next/server";
import { runDemo } from "@/lib/agent-demo";
import { runGemini } from "@/lib/agent-gemini";
import { accessGranted, looksLikeInjection, rateLimited, validateMessages } from "@/lib/guardrails";
import type { AgentResult } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Lets the UI show whether a model is connected and whether a code is needed. */
export async function GET() {
  return NextResponse.json({
    mode: process.env.GEMINI_API_KEY ? "gemini" : "demo",
    requiresCode: Boolean(process.env.DEMO_ACCESS_CODE),
  });
}

export async function POST(req: Request) {
  if (!accessGranted(req.headers.get("x-demo-code"))) {
    return NextResponse.json({ error: "code_required" }, { status: 401 });
  }
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const messages = validateMessages(body);
  if (!messages) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const last = messages[messages.length - 1].content;
  if (looksLikeInjection(last)) {
    const blocked: AgentResult = {
      reply: "Eso no lo puedo hacer. Estoy limitado a consultar los datos de la empresa: clientes, cobranza, almacén, catálogo, políticas y cotizaciones.",
      steps: [],
      actions: [],
      mode: process.env.GEMINI_API_KEY ? "gemini" : "demo",
    };
    return NextResponse.json(blocked);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      return NextResponse.json(await runGemini(messages, apiKey));
    } catch (err) {
      // Quota, timeout or model error: the simulated agent answers instead.
      console.error("[chat] model unavailable, using simulated agent:", err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.json(runDemo(last));
}
