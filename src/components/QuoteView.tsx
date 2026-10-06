"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import { buildQuote, decodeQuote, type Quote } from "@/lib/quote";
import { fecha, money } from "@/lib/text";

export default function QuoteView() {
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    const payload = decodeQuote(window.location.hash.slice(1));
    // Prices are rebuilt from the catalog here, so an edited link cannot change them.
    setQuote(payload ? buildQuote(payload) : null);
  }, []);

  if (quote === undefined) return <main className="doc" aria-busy="true" />;

  if (quote === null) {
    return (
      <main className="doc">
        <h1>No se pudo abrir esta cotización</h1>
        <p className="lead">El enlace está incompleto o ya no es válido. Pide la cotización otra vez desde el chat.</p>
        <Link href="/" className="back">Volver al chat</Link>
      </main>
    );
  }

  return (
    <main className="quote-page">
      <div className="quote-bar no-print">
        <Link href="/" className="btn-quiet">Volver al chat</Link>
        <div className="quote-bar-actions">
          <Link href="/integraciones/correo" className="btn btn-outline">Enviar por correo</Link>
          <button type="button" className="btn" onClick={() => window.print()}>
            Descargar PDF
          </button>
        </div>
      </div>
      <p className="quote-hint no-print">Para guardarla, elige “Guardar como PDF” en el cuadro de impresión.</p>

      <article className="sheet">
        <header className="sheet-head">
          <div>
            <div className="logo-slot">Tu logotipo</div>
            <p className="sheet-company">{brand.company}</p>
            <p>{brand.tagline}</p>
            <p>{brand.address}</p>
            <p>{brand.phone}, {brand.email}</p>
          </div>
          <dl className="sheet-meta">
            <div><dt>Cotización</dt><dd>{quote.folio}</dd></div>
            <div><dt>Fecha</dt><dd>{fecha(quote.fecha)}</dd></div>
            <div><dt>Vigente hasta</dt><dd>{fecha(quote.vigencia)}</dd></div>
          </dl>
        </header>

        <section className="sheet-client">
          <h2>Preparada para</h2>
          <p className="sheet-client-name">{quote.cliente.empresa}</p>
          <p>{quote.cliente.contacto}</p>
          <p>{quote.cliente.correo}</p>
        </section>

        <div className="table-scroll">
          <table className="sheet-table">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Descripción</th>
                <th scope="col" className="num">Cantidad</th>
                <th scope="col" className="num">Precio unitario</th>
                <th scope="col" className="num">Importe</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineas.map((l, i) => (
                <tr key={`${l.codigo}-${i}`}>
                  <td>{l.codigo}</td>
                  <td>{l.descripcion}</td>
                  <td className="num">{l.cantidad} {l.unidad}{l.cantidad > 1 ? "s" : ""}</td>
                  <td className="num">{money(l.precio)}</td>
                  <td className="num">{money(l.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="sheet-totals">
          <div><dt>Subtotal</dt><dd>{money(quote.subtotal)}</dd></div>
          <div><dt>IVA {Math.round(brand.ivaRate * 100)}%</dt><dd>{money(quote.iva)}</dd></div>
          <div className="grand"><dt>Total</dt><dd>{money(quote.total)}</dd></div>
        </dl>

        <section className="sheet-terms">
          <h2>Condiciones</h2>
          <ul>
            <li>Precios en pesos mexicanos.</li>
            <li>50% de anticipo y 50% contra entrega.</li>
            <li>Un año de garantía en mano de obra de instalación. La garantía del equipo es la del fabricante.</li>
            {quote.notas && <li>{quote.notas}</li>}
          </ul>
        </section>

        <footer className="sheet-foot">Documento de demostración generado por {brand.product}. Los datos son ficticios.</footer>
      </article>
    </main>
  );
}
