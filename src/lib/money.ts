import { Prisma } from "@/generated/prisma/client";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

/** Compute tutor earnings: hourly rate × (minutes / 60), rounded to cents. */
export function computeEarnings(hourlyRate: Decimal | string | number, durationMinutes: number): Decimal {
  return new Decimal(hourlyRate).mul(durationMinutes).div(60).toDecimalPlaces(2);
}

/** Sum a list of decimal-like values to a Decimal. */
export function sumDecimals(values: (Decimal | string | number)[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(new Decimal(v)), new Decimal(0));
}

/** Format a decimal-like value as USD, e.g. 1234.5 → "$1,234.50". */
export function formatUSD(value: Decimal | string | number): string {
  const n = new Decimal(value);
  return n.toNumber().toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** Format minutes as "1h 30m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
