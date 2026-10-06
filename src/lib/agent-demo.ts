// Simulated agent: picks tools with plain rules instead of a language model.
// It keeps the demo working with no API key and no cost, and it is the fallback
// when the model is unavailable or rate limited.

import { faq } from "./data";
import { norm, stem } from "./text";
import { detectItems, findClient, runTool, type Action, type AgentResult, type Step } from "./tools";

const HELP = [
  "Puedo ayudarte con esto:",
  "- El estatus de un cliente y lo que se le ha hecho",
  "- Cuentas por cobrar y facturas vencidas",
  "- Existencias en almacén",
  "- Especificaciones y precios del catálogo",
  "- Políticas de la empresa: garantías, horarios, pagos",
  "- Tu resumen del día",
  "- Armar una cotización",
  "",
  "Prueba con: ¿cuál es el estatus de Hotel Marea Azul?",
].join("\n");

export function runDemo(message: string): AgentResult {
  const n = norm(message);
  const s = stem(message);
  const steps: Step[] = [];
  const actions: Action[] = [];
  const parts: string[] = [];
  const call = (name: string, args: Record<string, unknown> = {}) => {
    const out = runTool(name, args);
    if (!out) return;
    steps.push(out.step);
    for (const a of out.actions) if (!actions.some((x) => x.href === a.href)) actions.push(a);
    parts.push(out.text);
  };
  const done = (): AgentResult => ({ reply: parts.join("\n\n"), steps, actions, mode: "demo" });

  const client = findClient(message);
  const items = detectItems(message);
  const wantsSend = /\b(envia|enviar|enviale|enviala|manda|mandar|mandale|mandala)/.test(n);
  const wantsQuote =
    /\b(cotiza|cotizar|cotizame|cotizale|presupuesto)\b/.test(n) ||
    (/cotizacion/.test(n) && /\b(haz|hazme|hacer|hacerle|arma|armame|genera|prepara|crea|necesito|quiero)\b/.test(n));

  if (wantsQuote) {
    call("crear_cotizacion", { cliente: client?.empresa ?? "", partidas: items });
    if (wantsSend) call("enviar_cotizacion");
    return done();
  }
  if (wantsSend && /cotizacion|correo/.test(n)) {
    call("enviar_cotizacion");
    return done();
  }
  if (/vencid|cobra|\bdeben?\b|adeud|saldo|factura|por cobrar/.test(n)) {
    call("cuentas_por_cobrar", { cliente: client?.empresa ?? "" });
    return done();
  }
  if (/almacen|existencia|inventario|stock|bajo (el )?minimo|resurtir|cuant[oa]s .*(hay|tengo|tenemos|quedan)/.test(n)) {
    call("consultar_almacen", { busqueda: message, soloBajoMinimo: /bajo (el )?minimo|resurtir|falta/.test(n) });
    return done();
  }
  if (!client && /mantenimiento|poliza/.test(n) && /proxim|semana|mes|pendiente|programad|cuando|tengo|toca/.test(n)) {
    call("proximos_mantenimientos");
    return done();
  }
  if (/\bhoy\b|agenda|bandeja|correos|pendientes|actividades|mi dia|resumen/.test(n)) {
    call("resumen_del_dia");
    return done();
  }
  if (faq.some((f) => f.claves.some((k) => s.includes(stem(k))))) {
    call("consultar_faq", { pregunta: message });
    return done();
  }
  if (items.length > 0 || /especificacion|ficha|catalogo|precio|cuesta|caracteristica|modelo|capacidad/.test(n)) {
    call("buscar_catalogo", { busqueda: message });
    return done();
  }
  if (client) {
    call("buscar_cliente", { nombre: client.empresa });
    return done();
  }
  if (/^(hola|buenos dias|buenas|que tal|hey)\b/.test(n) && n.length < 40) {
    return { reply: `Hola. ${HELP}`, steps, actions, mode: "demo" };
  }
  return { reply: `No tengo datos para responder eso. ${HELP}`, steps, actions, mode: "demo" };
}
