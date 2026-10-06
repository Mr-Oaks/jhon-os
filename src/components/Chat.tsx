"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

type Step = { tool: string; label: string };
type Action = { label: string; href: string; kind: "quote" | "integration" };
type Msg = { id: number; role: "user" | "assistant"; content: string; steps?: Step[]; actions?: Action[] };

const STORAGE_KEY = "jhon-os:chat";
const MAX_CHARS = 600;

const SUGGESTIONS = [
  "¿Cuál es el estatus de Hotel Marea Azul?",
  "¿Qué clientes tienen facturas vencidas?",
  "¿Cuántos minisplits de 1 tonelada hay en almacén?",
  "Dame las especificaciones del paquete de 5 toneladas",
  "Cotiza para Clínica Santa Elena 3 minisplits de 1 tonelada con instalación",
  "¿Qué tengo para hoy?",
];

/** Renders the agent's text as React nodes. No HTML is ever injected. */
function RichText({ text }: { text: string }) {
  const inline = (line: string, key: string): ReactNode[] =>
    line.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
      chunk.startsWith("**") && chunk.endsWith("**") && chunk.length > 4 ? <strong key={`${key}-${i}`}>{chunk.slice(2, -2)}</strong> : chunk,
    );

  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={`p-${blocks.length}`}>{inline(line, `p-${blocks.length}`)}</p>);
  }
  flush();
  return <div className="rich">{blocks}</div>;
}

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"gemini" | "demo" | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [restored, setRestored] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        const ok = saved.filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"));
        nextId.current = ok.length + 1;
        setMessages(ok.map((m, i) => ({ ...m, id: i + 1 })));
      }
    } catch {
      /* storage unavailable: start empty */
    }
    setRestored(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((info: { mode?: "gemini" | "demo"; requiresCode?: boolean }) => {
        setMode(info.mode ?? "demo");
        setNeedsCode(Boolean(info.requiresCode));
      })
      .catch(() => setMode("demo"));
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, restored]);

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || loading) return;
    const previous = messages;
    const history: Msg[] = [...previous, { id: nextId.current++, role: "user", content }];
    setMessages(history);
    setInput("");
    setError("");
    setLoading(true);

    const fail = (message: string) => {
      setMessages(previous);
      setInput(content);
      setError(message);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", ...(code ? { "x-demo-code": code } : {}) },
        body: JSON.stringify({ messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
      });
      if (res.status === 401) {
        setNeedsCode(true);
        fail(code ? "Ese código no es válido. Revísalo y vuelve a enviar." : "Escribe el código de acceso para usar el demo.");
      } else if (res.status === 429) {
        fail("Llegaste al límite de mensajes del demo. Espera unos minutos y vuelve a enviar.");
      } else if (!res.ok) {
        fail("No se obtuvo respuesta. Vuelve a enviar el mensaje.");
      } else {
        const data = (await res.json()) as { reply: string; steps: Step[]; actions: Action[]; mode: "gemini" | "demo" };
        setMode(data.mode);
        setMessages([...history, { id: nextId.current++, role: "assistant", content: data.reply, steps: data.steps, actions: data.actions }]);
      }
    } catch {
      fail("No hay conexión con el servidor. Revisa tu red y vuelve a enviar.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }
  function reset() {
    setMessages([]);
    setError("");
    nextId.current = 1;
  }

  const empty = messages.length === 0;

  return (
    <div className="chat">
      <header className="chat-head">
        <p className="mode" title={mode === "gemini" ? "Un modelo de lenguaje decide qué herramientas usar." : "Sin modelo de lenguaje: las herramientas se eligen con reglas."}>
          <span className={`dot ${mode === "gemini" ? "dot-live" : ""}`} aria-hidden="true" />
          {mode === null ? "Conectando" : mode === "gemini" ? "Modelo conectado" : "Modo simulado"}
        </p>
        {!empty && (
          <button type="button" className="btn-quiet" onClick={reset}>
            Nueva conversación
          </button>
        )}
      </header>

      <div className="chat-scroll">
        <div className="column">
          {empty ? (
            <section className="welcome">
              <h1>¿Qué necesitas saber de la operación?</h1>
              <p className="lead">Jhon consulta clientes, cobranza, almacén y catálogo, y arma cotizaciones. Elige una pregunta o escribe la tuya.</p>
              <ul className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => void send(s)} disabled={loading}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <ol className="thread" aria-live="polite">
              {messages.map((m) =>
                m.role === "user" ? (
                  <li key={m.id} className="msg msg-user">
                    <p>{m.content}</p>
                  </li>
                ) : (
                  <li key={m.id} className="msg msg-agent">
                    {m.steps && m.steps.length > 0 && (
                      <ul className="steps" aria-label="Pasos del agente">
                        {m.steps.map((s, i) => (
                          <li key={`${s.tool}-${i}`} className="plate">
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <RichText text={m.content} />
                    {m.actions && m.actions.length > 0 && (
                      <div className="actions">
                        {m.actions.map((a) =>
                          a.kind === "quote" ? (
                            <a key={a.href} className="btn" href={a.href} target="_blank" rel="noopener">
                              {a.label}
                            </a>
                          ) : (
                            <Link key={a.href} className="btn btn-outline" href={a.href}>
                              {a.label}
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </li>
                ),
              )}
              {loading && (
                <li className="msg msg-agent">
                  <p className="working">Jhon está revisando los datos</p>
                </li>
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="composer-wrap">
        <div className="column">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {needsCode && (
            <label className="code-field">
              <span>Código de acceso</span>
              <input type="password" value={code} onChange={(e) => setCode(e.target.value.slice(0, 64))} autoComplete="off" />
            </label>
          )}
          <form className="composer" onSubmit={onSubmit}>
            <label htmlFor="pregunta" className="sr-only">
              Tu pregunta para Jhon
            </label>
            <textarea
              id="pregunta"
              rows={2}
              maxLength={MAX_CHARS}
              placeholder="Pregunta por un cliente, el almacén, la cobranza o pide una cotización"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="submit" className="btn" disabled={loading || !input.trim()}>
              Enviar
            </button>
          </form>
          <p className="fineprint">Datos ficticios. El agente consulta y redacta, pero no envía ni modifica nada.</p>
        </div>
      </div>
    </div>
  );
}
