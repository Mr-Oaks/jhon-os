import type { Metadata } from "next";
import QuoteView from "@/components/QuoteView";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: `Cotización | ${brand.product}` };

export default function QuotePage() {
  return <QuoteView />;
}
