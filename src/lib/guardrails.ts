// Server-side guardrails. The main defense against prompt injection is
// structural (closed tool list, validated arguments, prices computed in code,
// no automatic sending). The checks here are an extra, cheap layer in front.

import { timingSafeEqual } from "node:crypto";
import { norm } from "./text";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const LIMITS = {
  userChars: 600,
  assistantChars: 4000,
  messages: 12,
  requestsPerWindow: 20,
  windowMs: 10 * 60 * 1000,
};

function clean(s: string): string {
  // Control characters are dropped; everything is treated as plain text.
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
}

export function validateMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-LIMITS.messages)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = clean(content);
    if (!text) continue;
    if (role === "user" && text.length > LIMITS.userChars) return null;
    out.push({ role, content: text.slice(0, LIMITS.assistantChars) });
  }
  if (out.length === 0 || out[out.length - 1].role !== "user") return null;
  return out;
}

const INJECTION = [
  /ignor[ae] (todas? )?(las |tus |mis )?instrucciones/,
  /olvida (todas? )?(las |tus )?(instrucciones|reglas)/,
  /ignore (all |any |the )?(previous|prior|above) (instructions|rules)/,
  /system prompt|prompt del sistema|instrucciones del sistema|tus instrucciones internas/,
  /jailbreak|developer mode|modo desarrollador|sin restricciones/,
  /<\s*script|javascript:|on(error|load)\s*=/,
  /\b(drop|truncate)\s+table\b|\bunion\s+select\b|;\s*delete\s+from\b/,
];

export function looksLikeInjection(text: string): boolean {
  const n = norm(text);
  return INJECTION.some((re) => re.test(n));
}

// Best-effort limiter: memory is per serverless instance. Production would use
// a shared store (see UPSTASH_* in .env.example).
const hits = new Map<string, number[]>();
export function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < LIMITS.windowMs);
  if (recent.length >= LIMITS.requestsPerWindow) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export function accessGranted(provided: string | null): boolean {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) return true;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
