import Link from "next/link";

export default function NotFound() {
  return (
    <main className="doc">
      <h1>Esta página no existe</h1>
      <p className="lead">Puede que el enlace esté incompleto.</p>
      <Link href="/" className="back">Volver al chat</Link>
    </main>
  );
}
