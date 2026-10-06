// Quote building. Prices always come from the catalog, never from the model or
// from the URL, so neither a prompt nor an edited link can change an amount.

import { brand } from "./brand";
import { clientes, productos, servicios, dayOffset, type Client } from "./data";

export type QuotePayload = {
  f: string; // folio
  d: string; // ISO date
  c: string; // client id
  p: Array<[string, number]>; // [code, quantity]
  n?: string; // notes
};

export type QuoteLine = {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio: number;
  importe: number;
};

export type Quote = {
  folio: string;
  fecha: string;
  vigencia: string;
  cliente: Client;
  lineas: QuoteLine[];
  subtotal: number;
  iva: number;
  total: number;
  notas: string;
};

const FOLIO = /^COT-\d{6}-\d{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_LINES = 12;
export const MAX_QTY = 200;

export function newFolio(): string {
  const d = dayOffset(0).replace(/-/g, "").slice(2);
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `COT-${d}-${n}`;
}

export function lookupItem(code: string): Omit<QuoteLine, "cantidad" | "importe"> | null {
  const c = code.trim().toUpperCase();
  const p = productos.find((x) => x.sku === c);
  if (p) {
    return { codigo: p.sku, descripcion: `${p.tipo} ${p.marca} ${p.modelo}, ${p.capacidad}`, unidad: "pieza", precio: p.precio };
  }
  const s = servicios.find((x) => x.clave === c);
  if (s) return { codigo: s.clave, descripcion: s.descripcion, unidad: s.unidad, precio: s.precio };
  return null;
}

export function buildQuote(payload: QuotePayload): Quote | null {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.f !== "string" || !FOLIO.test(payload.f)) return null;
  if (typeof payload.d !== "string" || !ISO_DATE.test(payload.d)) return null;
  const cliente = clientes.find((c) => c.id === payload.c);
  if (!cliente || !Array.isArray(payload.p)) return null;

  const lineas: QuoteLine[] = [];
  for (const row of payload.p.slice(0, MAX_LINES)) {
    if (!Array.isArray(row)) continue;
    const item = lookupItem(String(row[0] ?? ""));
    const cantidad = Math.floor(Number(row[1]));
    if (!item || !Number.isFinite(cantidad) || cantidad < 1 || cantidad > MAX_QTY) continue;
    lineas.push({ ...item, cantidad, importe: item.precio * cantidad });
  }
  if (lineas.length === 0) return null;

  const subtotal = lineas.reduce((sum, l) => sum + l.importe, 0);
  const iva = Math.round(subtotal * brand.ivaRate * 100) / 100;
  const vigencia = new Date(new Date(`${payload.d}T12:00:00Z`).getTime() + brand.quoteValidityDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return {
    folio: payload.f,
    fecha: payload.d,
    vigencia,
    cliente,
    lineas,
    subtotal,
    iva,
    total: subtotal + iva,
    notas: typeof payload.n === "string" ? payload.n.slice(0, 300) : "",
  };
}

export function encodeQuote(payload: QuotePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeQuote(encoded: string): QuotePayload | null {
  try {
    if (!encoded || encoded.length > 2000) return null;
    const bin = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as QuotePayload;
  } catch {
    return null;
  }
}
