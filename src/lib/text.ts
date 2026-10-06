// Small text helpers shared by server and client.

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalizes and drops simple plurals so "minisplits" matches "minisplit". */
export function stem(s: string): string {
  return norm(s).replace(/([a-z]{3,})s\b/g, "$1");
}

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
export function money(n: number): string {
  return mxn.format(n);
}

export function fecha(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
