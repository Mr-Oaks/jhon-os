import Link from "next/link";
import Chat from "@/components/Chat";
import { brand } from "@/lib/brand";
import { integrations } from "@/lib/integrations";

const fuentes = ["Clientes y proyectos", "Memorias técnicas", "Cuentas por cobrar", "Catálogo y servicios", "Almacén", "Políticas de la empresa"];

export default function Home() {
  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">
          <p className="product">{brand.product}</p>
          <p className="company">{brand.company}</p>
          <p className="placeholder-note">{brand.placeholderNote}</p>
        </div>

        <details className="rail-section" open>
          <summary>Lo que Jhon consulta</summary>
          <ul className="source-list">
            {fuentes.map((f) => (
              <li key={f}>
                <span>{f}</span>
                <span className="tag tag-sample">Ejemplo</span>
              </li>
            ))}
          </ul>
        </details>

        <details className="rail-section" open>
          <summary>Conexiones previstas</summary>
          <ul className="source-list">
            {integrations.map((i) => (
              <li key={i.slug}>
                <Link href={`/integraciones/${i.slug}`}>{i.nombre}</Link>
              </li>
            ))}
          </ul>
        </details>

        <p className="rail-foot">Demo con datos ficticios. No envía correos ni modifica sistemas.</p>
      </aside>

      <main className="main">
        <Chat />
      </main>
    </div>
  );
}
