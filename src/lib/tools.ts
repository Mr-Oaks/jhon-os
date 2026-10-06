// The agent's tools. This is the only way the agent can touch data: a closed
// list of functions with validated arguments. No free-form queries, no code
// execution. Both the Gemini agent and the simulated agent call these.

import { brand } from "./brand";
import {
  agenda,
  almacen,
  bandeja,
  clientes,
  cobranza,
  dayOffset,
  faq,
  mantenimientos,
  productos,
  proyectos,
  servicios,
  type Client,
} from "./data";
import { buildQuote, encodeQuote, lookupItem, newFolio, MAX_LINES, MAX_QTY, type QuotePayload } from "./quote";
import { fecha, money, stem } from "./text";

export type Action = { label: string; href: string; kind: "quote" | "integration" };
export type Step = { tool: string; label: string };
export type ToolOutput = { data: unknown; text: string; actions: Action[] };
export type AgentResult = { reply: string; steps: Step[]; actions: Action[]; mode: "gemini" | "demo" };

type Args = Record<string, unknown>;
type Tool = {
  name: string;
  label: string; // shown in the UI as the visible agent step
  description: string;
  parameters?: Record<string, unknown>; // Gemini function-declaration schema
  run: (args: Args) => ToolOutput;
};

// ── argument validation ──────────────────────────────────────────────
function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").slice(0, max).trim() : "";
}
function int(v: unknown, min: number, max: number): number | null {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// ── lookups ──────────────────────────────────────────────────────────
export function findClient(query: string): Client | undefined {
  const q = stem(query);
  if (q.length < 3) return undefined;
  return (
    clientes.find((c) => q.includes(stem(c.empresa))) ??
    clientes.find((c) => c.claves.some((k) => q.includes(stem(k)))) ??
    clientes.find((c) => c.id.toLowerCase() === q) ??
    clientes.find((c) => q.length >= 4 && stem(c.empresa).includes(q))
  );
}

const WORD_NUMBERS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tre: 3, cuatro: 4, cinco: 5, seis: 6, ocho: 8, diez: 10 };
const QTY_BEFORE = /(\d{1,3}|un|una|uno|dos|tre|cuatro|cinco|seis|ocho|diez)(?:\s*(?:x|pza|pieza|equipo|hora|hr|visita))?(?:\s+de)?$/;

/** Finds catalog items mentioned in free text, with the quantity written before each one. */
export function detectItems(text: string): Array<{ codigo: string; cantidad: number }> {
  const s = stem(text);
  const found = new Map<string, number>();
  const all = [
    ...productos.map((p) => ({ codigo: p.sku, claves: p.claves })),
    ...servicios.map((x) => ({ codigo: x.clave, claves: x.claves })),
  ];
  const qtyAt = (idx: number): number => {
    const m = s.slice(0, idx).trimEnd().match(QTY_BEFORE);
    if (!m) return 1;
    const n = WORD_NUMBERS[m[1]] ?? parseInt(m[1], 10);
    return Math.min(Math.max(n, 1), MAX_QTY);
  };
  for (const item of all) {
    for (const k of item.claves) {
      const idx = s.indexOf(stem(k));
      if (idx >= 0) {
        found.set(item.codigo, qtyAt(idx));
        break;
      }
    }
  }
  // Generic mentions fall back to the most common model.
  const hasMs = found.has("AER-MS12") || found.has("AER-MS24");
  if (!hasMs && s.includes("minisplit")) found.set("AER-MS12", qtyAt(s.indexOf("minisplit")));
  // "con instalación" without detail: one installation per equipment quoted.
  if (s.includes("instalacion") && !found.has("SRV-INST-MS") && !found.has("SRV-INST-PK")) {
    const ms = (found.get("AER-MS12") ?? 0) + (found.get("AER-MS24") ?? 0);
    const pk = (found.get("NOR-PK05") ?? 0) + (found.get("NOR-PK10") ?? 0);
    if (ms > 0) found.set("SRV-INST-MS", ms);
    if (pk > 0) found.set("SRV-INST-PK", pk);
  }
  return [...found].map(([codigo, cantidad]) => ({ codigo, cantidad }));
}

const STOP = new Set(
  "de del la el lo los las que para con por una uno un dame dime cual cuales son hay tengo tiene tenemos en es y o a me mi especificacione ficha precio cuanto cuesta catalogo equipo almacen existencia cuanto queda como esta sobre tecnica".split(" "),
);
function tokens(q: string): string[] {
  return stem(q)
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function searchCatalog(query: string) {
  const direct = detectItems(query).map((d) => d.codigo);
  const hay = [
    ...productos.map((p) => ({ codigo: p.sku, text: stem([p.sku, p.tipo, p.marca, p.modelo, p.capacidad, p.especificaciones, ...p.claves].join(" ")) })),
    ...servicios.map((x) => ({ codigo: x.clave, text: stem([x.clave, x.descripcion, ...x.claves].join(" ")) })),
  ];
  let codes = direct;
  if (codes.length === 0) {
    const ts = tokens(query);
    const scored = hay.map((h) => ({ codigo: h.codigo, score: ts.filter((t) => h.text.includes(t)).length }));
    const best = Math.max(0, ...scored.map((x) => x.score));
    codes = best > 0 ? scored.filter((x) => x.score === best).map((x) => x.codigo) : [];
  }
  return codes.slice(0, 5);
}

function clientName(id: string): string {
  return clientes.find((c) => c.id === id)?.empresa ?? id;
}

// ── tools ────────────────────────────────────────────────────────────
const buscarCliente: Tool = {
  name: "buscar_cliente",
  label: "Consultó clientes y proyectos",
  description: "Estatus de un cliente: contacto, notas, proyectos realizados con su memoria técnica, saldo por cobrar y próximo mantenimiento.",
  parameters: { type: "OBJECT", properties: { nombre: { type: "STRING", description: "Nombre o parte del nombre del cliente" } }, required: ["nombre"] },
  run(args) {
    const c = findClient(str(args.nombre));
    if (!c) {
      const lista = clientes.map((x) => x.empresa);
      return { data: { encontrado: false, clientes: lista }, text: `No encontré ese cliente. Los clientes registrados son:\n${lista.map((x) => `- ${x}`).join("\n")}`, actions: [] };
    }
    const proys = proyectos().filter((p) => p.clienteId === c.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const abiertas = cobranza().filter((f) => f.clienteId === c.id && f.estatus !== "Pagada");
    const saldo = abiertas.reduce((s, f) => s + f.monto, 0);
    const vencidas = abiertas.filter((f) => f.estatus === "Vencida");
    const prox = mantenimientos().filter((m) => m.clienteId === c.id && m.fecha >= dayOffset(0)).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    const lines = [
      `**${c.empresa}** (${c.estatus})`,
      `Contacto: ${c.contacto}, ${c.telefono}`,
      `Notas: ${c.notas}`,
      "",
      proys.length ? "**Proyectos**" : "Aún no tiene proyectos registrados.",
      ...proys.map((p) => `- ${fecha(p.fecha)}, ${p.tipo.toLowerCase()}: ${p.descripcion} Memoria técnica: ${p.memoriaTecnica}`),
      "",
      saldo > 0
        ? `**Por cobrar:** ${money(saldo)} en ${abiertas.length} factura${abiertas.length > 1 ? "s" : ""}${vencidas.length ? `, ${vencidas.length} vencida${vencidas.length > 1 ? "s" : ""}` : ""}.`
        : "**Por cobrar:** sin saldo pendiente.",
      prox ? `**Próximo mantenimiento:** ${fecha(prox.fecha)}. ${prox.alcance}.` : "",
    ];
    return { data: { encontrado: true, cliente: c, proyectos: proys, facturasAbiertas: abiertas, saldo, proximoMantenimiento: prox ?? null }, text: lines.filter((l, i) => l !== "" || i < lines.length - 1).join("\n"), actions: [] };
  },
};

const cuentasPorCobrar: Tool = {
  name: "cuentas_por_cobrar",
  label: "Consultó cobranza",
  description: "Facturas pendientes y vencidas, de todos los clientes o de uno solo.",
  parameters: { type: "OBJECT", properties: { cliente: { type: "STRING", description: "Opcional. Nombre del cliente" } } },
  run(args) {
    const c = findClient(str(args.cliente));
    const abiertas = cobranza()
      .filter((f) => f.estatus !== "Pagada" && (!c || f.clienteId === c.id))
      .sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
    const total = abiertas.reduce((s, f) => s + f.monto, 0);
    const vencido = abiertas.filter((f) => f.estatus === "Vencida").reduce((s, f) => s + f.monto, 0);
    const data = { cliente: c?.empresa ?? "todos", total, vencido, facturas: abiertas.map((f) => ({ ...f, cliente: clientName(f.clienteId) })) };
    if (abiertas.length === 0) return { data, text: `${c ? c.empresa : "Ningún cliente"} no tiene facturas pendientes.`, actions: [] };
    const text = [
      `**Por cobrar${c ? ` a ${c.empresa}` : ""}:** ${money(total)}, de los cuales ${money(vencido)} ya vencieron.`,
      ...abiertas.map((f) => `- ${f.factura}, ${clientName(f.clienteId)}: ${money(f.monto)}. ${f.estatus === "Vencida" ? `**Venció** el ${fecha(f.vencimiento)}` : `Vence el ${fecha(f.vencimiento)}`}.`),
    ].join("\n");
    return { data, text, actions: [] };
  },
};

const consultarAlmacen: Tool = {
  name: "consultar_almacen",
  label: "Consultó almacén",
  description: "Existencias en almacén por equipo o refacción, con mínimo y ubicación. Sin búsqueda devuelve todo el inventario.",
  parameters: {
    type: "OBJECT",
    properties: {
      busqueda: { type: "STRING", description: "Opcional. SKU, modelo o tipo de equipo" },
      soloBajoMinimo: { type: "BOOLEAN", description: "Opcional. true para ver solo lo que hay que resurtir" },
    },
  },
  run(args) {
    const q = str(args.busqueda);
    const soloBajos = args.soloBajoMinimo === true;
    const codes = q && !soloBajos ? searchCatalog(q).filter((c) => almacen.some((a) => a.sku === c)) : [];
    const rows = (codes.length ? almacen.filter((a) => codes.includes(a.sku)) : almacen)
      .map((a) => {
        const p = productos.find((x) => x.sku === a.sku)!;
        return { ...a, descripcion: `${p.tipo} ${p.marca} ${p.modelo}, ${p.capacidad}`, bajoMinimo: a.existencia < a.minimo };
      })
      .filter((r) => !soloBajos || r.bajoMinimo);
    const bajos = rows.filter((r) => r.bajoMinimo);
    if (soloBajos) {
      const text = rows.length
        ? ["**Por resurtir**", ...rows.map((r) => `- ${r.descripcion} (${r.sku}): hay ${r.existencia}, el mínimo es ${r.minimo}`)].join("\n")
        : "Todo el almacén está por encima del mínimo.";
      return { data: { soloBajoMinimo: true, articulos: rows }, text, actions: [] };
    }
    const text = [
      codes.length ? "**Existencias**" : "**Inventario completo**",
      ...rows.map((r) => `- ${r.descripcion} (${r.sku}): ${r.existencia} en ${r.ubicacion}${r.bajoMinimo ? `. **Bajo el mínimo de ${r.minimo}**` : ""}`),
      bajos.length ? `\nHay ${bajos.length} artículo${bajos.length > 1 ? "s" : ""} por debajo del mínimo. Conviene resurtir.` : "",
    ].filter(Boolean).join("\n");
    return { data: { filtrado: codes.length > 0, articulos: rows }, text, actions: [] };
  },
};

const buscarCatalogo: Tool = {
  name: "buscar_catalogo",
  label: "Consultó catálogo",
  description: "Especificaciones y precios de lista de equipos, refacciones y servicios. Devuelve también el código de cada artículo para cotizar.",
  parameters: { type: "OBJECT", properties: { busqueda: { type: "STRING", description: "Equipo, modelo, capacidad o servicio" } }, required: ["busqueda"] },
  run(args) {
    const codes = searchCatalog(str(args.busqueda));
    const ps = productos.filter((p) => codes.includes(p.sku));
    const ss = servicios.filter((s) => codes.includes(s.clave));
    if (ps.length + ss.length === 0) {
      const all = [...productos.map((p) => `- ${p.sku}: ${p.tipo} ${p.marca} ${p.modelo}, ${p.capacidad}`), ...servicios.map((s) => `- ${s.clave}: ${s.descripcion}`)];
      return { data: { encontrados: 0, catalogo: all }, text: `No encontré eso en el catálogo. Esto es lo que manejamos:\n${all.join("\n")}`, actions: [] };
    }
    const text = [
      ...ps.map((p) => {
        const st = almacen.find((a) => a.sku === p.sku);
        return `**${p.tipo} ${p.marca} ${p.modelo}** (${p.sku})\n- Capacidad: ${p.capacidad}\n- ${p.especificaciones}\n- Precio de lista: ${money(p.precio)} más IVA\n- En almacén: ${st?.existencia ?? 0}`;
      }),
      ...ss.map((s) => `**${s.descripcion}** (${s.clave})\n- ${money(s.precio)} más IVA por ${s.unidad}`),
    ].join("\n\n");
    return { data: { productos: ps.map(({ claves, ...p }) => p), servicios: ss.map(({ claves, ...s }) => s) }, text, actions: [] };
  },
};

const consultarFaq: Tool = {
  name: "consultar_faq",
  label: "Consultó políticas de la empresa",
  description: "Políticas y métodos de trabajo: garantías, horarios, condiciones de pago, alcance del mantenimiento, zona de servicio, reportes.",
  parameters: { type: "OBJECT", properties: { pregunta: { type: "STRING", description: "La duda sobre políticas o procesos" } }, required: ["pregunta"] },
  run(args) {
    const q = stem(str(args.pregunta, 300));
    const ts = tokens(q);
    const scored = faq
      .map((f) => ({ f, score: (f.claves.some((k) => q.includes(stem(k))) ? 3 : 0) + ts.filter((t) => stem(f.pregunta + " " + f.respuesta).includes(t)).length }))
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    if (scored.length === 0) {
      return { data: { encontrado: false, temas: faq.map((f) => f.pregunta) }, text: `Eso no está en las políticas cargadas. Los temas disponibles son:\n${faq.map((f) => `- ${f.pregunta}`).join("\n")}`, actions: [] };
    }
    return {
      data: { encontrado: true, respuestas: scored.map((x) => ({ pregunta: x.f.pregunta, respuesta: x.f.respuesta })) },
      text: scored.map((x) => `**${x.f.pregunta}**\n${x.f.respuesta}`).join("\n\n"),
      actions: [],
    };
  },
};

const proximosMantenimientos: Tool = {
  name: "proximos_mantenimientos",
  label: "Consultó mantenimientos programados",
  description: "Mantenimientos preventivos programados para los próximos días, por cliente.",
  run() {
    const hoy = dayOffset(0);
    const rows = mantenimientos().filter((m) => m.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((m) => ({ ...m, cliente: clientName(m.clienteId) }));
    const text = ["**Mantenimientos programados**", ...rows.map((m) => `- ${m.fecha === hoy ? "**Hoy**" : fecha(m.fecha)}, ${m.cliente}: ${m.alcance}.`)].join("\n");
    return { data: { mantenimientos: rows }, text, actions: [] };
  },
};

const resumenDelDia: Tool = {
  name: "resumen_del_dia",
  label: "Revisó bandeja, agenda y pendientes",
  description: "Resumen del día: correos de ayer que piden acción, agenda de hoy, facturas vencidas, mantenimientos de hoy y artículos bajo mínimo.",
  run() {
    const hoy = dayOffset(0);
    const vencidas = cobranza().filter((f) => f.estatus === "Vencida");
    const mant = mantenimientos().filter((m) => m.fecha === hoy);
    const bajos = almacen.filter((a) => a.existencia < a.minimo);
    const text = [
      `**Tu día, ${fecha(hoy)}**`,
      "",
      "**Agenda**",
      ...agenda.map((e) => `- ${e.hora}, ${e.titulo} (${e.lugar})`),
      "",
      "**Correos de ayer que piden acción**",
      ...bandeja.map((m) => `- ${m.de}: ${m.resumen} Siguiente paso: ${m.accion.charAt(0).toLowerCase() + m.accion.slice(1)}.`),
      "",
      "**Para no perder de vista**",
      `- ${vencidas.length} factura${vencidas.length === 1 ? "" : "s"} vencida${vencidas.length === 1 ? "" : "s"} por ${money(vencidas.reduce((s, f) => s + f.monto, 0))}.`,
      `- ${bajos.length} artículo${bajos.length === 1 ? "" : "s"} bajo el mínimo en almacén.`,
      ...mant.map((m) => `- Mantenimiento hoy en ${clientName(m.clienteId)}: ${m.alcance}.`),
      "",
      "La bandeja y la agenda son datos de ejemplo. Con la integración activa, este resumen llega por correo a las 9 am.",
    ].join("\n");
    return {
      data: { fecha: hoy, agenda, correos: bandeja, facturasVencidas: vencidas.map((f) => ({ ...f, cliente: clientName(f.clienteId) })), mantenimientosHoy: mant, bajoMinimo: bajos, nota: "Bandeja y agenda simuladas" },
      text,
      actions: [{ label: "Ver cómo se conecta el resumen diario", href: "/integraciones/resumen-diario", kind: "integration" }],
    };
  },
};

const crearCotizacion: Tool = {
  name: "crear_cotizacion",
  label: "Armó la cotización con precios del catálogo",
  description: "Crea una cotización para un cliente. Los precios y totales se calculan en el servidor desde el catálogo. Usa los códigos que devuelve buscar_catalogo.",
  parameters: {
    type: "OBJECT",
    properties: {
      cliente: { type: "STRING", description: "Nombre del cliente" },
      partidas: {
        type: "ARRAY",
        description: "Equipos, refacciones y servicios a cotizar",
        items: { type: "OBJECT", properties: { codigo: { type: "STRING", description: "SKU o clave, por ejemplo AER-MS12 o SRV-INST-MS" }, cantidad: { type: "INTEGER" } }, required: ["codigo", "cantidad"] },
      },
      notas: { type: "STRING", description: "Opcional. Condiciones o aclaraciones" },
    },
    required: ["cliente", "partidas"],
  },
  run(args) {
    const c = findClient(str(args.cliente));
    if (!c) {
      return { data: { error: "cliente_no_encontrado", clientes: clientes.map((x) => x.empresa) }, text: `Necesito un cliente registrado para cotizar. Puede ser:\n${clientes.map((x) => `- ${x.empresa}`).join("\n")}`, actions: [] };
    }
    const partidas: Array<[string, number]> = [];
    const raw = Array.isArray(args.partidas) ? args.partidas.slice(0, MAX_LINES) : [];
    for (const r of raw) {
      if (!r || typeof r !== "object") continue;
      const row = r as Args;
      const cantidad = int(row.cantidad, 1, MAX_QTY);
      if (cantidad === null) continue;
      const code = str(row.codigo, 80);
      const item = lookupItem(code) ?? lookupItem(detectItems(code)[0]?.codigo ?? "");
      if (item) partidas.push([item.codigo, cantidad]);
    }
    const payload: QuotePayload = { f: newFolio(), d: dayOffset(0), c: c.id, p: partidas };
    const notas = str(args.notas, 300);
    if (notas) payload.n = notas;
    const q = buildQuote(payload);
    if (!q) {
      return { data: { error: "sin_partidas_validas" }, text: "No reconocí ningún artículo del catálogo. Dime qué equipos o servicios incluir, por ejemplo: 2 minisplits de 1 tonelada con instalación.", actions: [] };
    }
    const text = [
      `**Cotización ${q.folio}** para ${q.cliente.empresa}`,
      ...q.lineas.map((l) => `- ${l.cantidad} × ${l.descripcion}: ${money(l.importe)}`),
      "",
      `Subtotal: ${money(q.subtotal)}`,
      `IVA ${Math.round(brand.ivaRate * 100)}%: ${money(q.iva)}`,
      `**Total: ${money(q.total)}**`,
      "",
      `Vigente hasta el ${fecha(q.vigencia)}. Revísala antes de enviarla.`,
    ].join("\n");
    return {
      data: { folio: q.folio, cliente: q.cliente.empresa, lineas: q.lineas, subtotal: q.subtotal, iva: q.iva, total: q.total, vigencia: q.vigencia, estado: "borrador, pendiente de revisión humana" },
      text,
      actions: [
        { label: "Ver cotización y descargar PDF", href: `/cotizacion#${encodeQuote(payload)}`, kind: "quote" },
        { label: "Enviar por correo", href: "/integraciones/correo", kind: "integration" },
      ],
    };
  },
};

const enviarCotizacion: Tool = {
  name: "enviar_cotizacion",
  label: "Preparó el envío (sin enviar)",
  description: "Solicita el envío de una cotización por correo. En el demo no envía nada: devuelve el enlace a la integración prevista.",
  parameters: { type: "OBJECT", properties: { folio: { type: "STRING" }, correo: { type: "STRING", description: "Correo del destinatario" } } },
  run() {
    return {
      data: { enviado: false, motivo: "El envío de correo está desactivado en el demo. Requiere aprobación humana y la integración de correo." },
      text: "En este demo no se envían correos. En producción, el envío sale desde el correo de la empresa y solo después de que apruebes la cotización en pantalla.",
      actions: [{ label: "Ver cómo se conecta el correo", href: "/integraciones/correo", kind: "integration" }],
    };
  },
};

export const tools: Tool[] = [buscarCliente, cuentasPorCobrar, consultarAlmacen, buscarCatalogo, consultarFaq, proximosMantenimientos, resumenDelDia, crearCotizacion, enviarCotizacion];

export function runTool(name: string, args: unknown): (ToolOutput & { step: Step }) | null {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return null;
  const safeArgs = args && typeof args === "object" && !Array.isArray(args) ? (args as Args) : {};
  const out = tool.run(safeArgs);
  return { ...out, step: { tool: tool.name, label: tool.label } };
}

export function functionDeclarations() {
  return tools.map(({ name, description, parameters }) => (parameters ? { name, description, parameters } : { name, description }));
}
