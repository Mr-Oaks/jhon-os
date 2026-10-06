import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/lib/brand";
import { getIntegration, integrations } from "@/lib/integrations";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return integrations.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getIntegration(slug);
  return { title: item ? `${item.nombre} | ${brand.product}` : brand.product };
}

export default async function IntegrationPage({ params }: Props) {
  const { slug } = await params;
  const item = getIntegration(slug);
  if (!item) notFound();

  return (
    <main className="doc">
      <Link href="/" className="back">Volver al chat</Link>

      <p className="tag tag-planned">Integración prevista, aún sin conectar</p>
      <h1>{item.nombre}</h1>
      <p className="lead">{item.resumen}</p>

      <section className="doc-block">
        <h2>Qué pasa hoy en el demo</h2>
        <p>{item.hoy}</p>
      </section>

      <section className="doc-block">
        <h2>Qué pasará al conectarla</h2>
        <ul>
          {item.conectada.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="doc-block">
        <h2>Qué se necesita de la empresa</h2>
        <ul>
          {item.requisitos.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="tech">Se conecta con {item.tecnologia}.</p>
      </section>

      <nav className="doc-nav" aria-label="Otras integraciones">
        <h2>Otras conexiones previstas</h2>
        <ul>
          {integrations
            .filter((i) => i.slug !== item.slug)
            .map((i) => (
              <li key={i.slug}>
                <Link href={`/integraciones/${i.slug}`}>{i.nombre}</Link>
              </li>
            ))}
        </ul>
      </nav>
    </main>
  );
}
