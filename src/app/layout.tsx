import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import { brand } from "@/lib/brand";
import "./globals.css";

const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow", display: "swap" });
const display = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-barlow-condensed", display: "swap" });

export const metadata: Metadata = {
  title: `${brand.product}, el asistente de operación para empresas de clima`,
  description: "Demo de un agente que consulta clientes, cobranza, almacén y catálogo, y arma cotizaciones para una empresa de aire acondicionado y calefacción.",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#E8EEF0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
