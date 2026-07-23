/**
 * Browser-safe formatters — no Prisma import. Prisma's Decimal (used by
 * formatUSD in money.ts) pulls in the full client runtime via `node:module`,
 * which can't be bundled for client components. Use these here instead.
 */
export function formatUSDPlain(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
