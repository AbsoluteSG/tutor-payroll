import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const D = Prisma.Decimal;
const zero = new D(0);

export type ReportBreakdownRow = {
  id: string;
  name: string;
  classes: number;
  minutes: number;
  billed: Prisma.Decimal;
  tutorEarnings: Prisma.Decimal;
  margin: Prisma.Decimal;
};

export type PeriodReport = {
  classes: number;
  minutes: number;
  /** Σ full cost of classes taught in the period. */
  billed: Prisma.Decimal;
  /** Σ tutor earnings accrued in the period. */
  tutorEarnings: Prisma.Decimal;
  /** billed − tutorEarnings. */
  margin: Prisma.Decimal;
  /** Client money actually received in the period. */
  received: Prisma.Decimal;
  /** Tutor payouts actually made in the period. */
  paidOut: Prisma.Decimal;
  byTutor: ReportBreakdownRow[];
  byClient: ReportBreakdownRow[];
};

/** Null bounds mean all-time. */
function dateFilter(start: Date | null, endExclusive: Date | null) {
  return start && endExclusive ? { gte: start, lt: endExclusive } : undefined;
}

/**
 * Activity for one date range: totals plus per-tutor and per-client
 * breakdowns. Voided classes are excluded throughout, matching `balances.ts`.
 */
export async function getPeriodReport(
  start: Date | null,
  endExclusive: Date | null,
): Promise<PeriodReport> {
  const range = dateFilter(start, endExclusive);
  const classWhere = { voided: false, ...(range ? { date: range } : {}) };

  const [byTutorAgg, byClientAgg, receivedAgg, paidOutAgg] = await Promise.all([
    prisma.classSession.groupBy({
      by: ["tutorId"],
      where: classWhere,
      _sum: { fullCost: true, tutorEarnings: true, durationMinutes: true },
      _count: { _all: true },
    }),
    prisma.classSession.groupBy({
      by: ["clientId"],
      where: classWhere,
      _sum: { fullCost: true, tutorEarnings: true, durationMinutes: true },
      _count: { _all: true },
    }),
    prisma.clientPayment.aggregate({
      where: range ? { receivedAt: range } : {},
      _sum: { amount: true },
    }),
    prisma.tutorPayment.aggregate({
      where: { status: "PAID", ...(range ? { paidAt: range } : {}) },
      _sum: { amount: true },
    }),
  ]);

  const [tutors, clients] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: byTutorAgg.map((g) => g.tutorId) } },
      select: { id: true, name: true },
    }),
    prisma.client.findMany({
      where: { id: { in: byClientAgg.map((g) => g.clientId) } },
      select: { id: true, paymentName: true },
    }),
  ]);
  const tutorNames = new Map(tutors.map((t) => [t.id, t.name]));
  const clientNames = new Map(clients.map((c) => [c.id, c.paymentName]));

  const toRow = (
    id: string,
    name: string,
    agg: {
      _sum: {
        fullCost: Prisma.Decimal | null;
        tutorEarnings: Prisma.Decimal | null;
        durationMinutes: number | null;
      };
      _count: { _all: number };
    },
  ): ReportBreakdownRow => {
    const billed = agg._sum.fullCost ?? zero;
    const tutorEarnings = agg._sum.tutorEarnings ?? zero;
    return {
      id,
      name,
      classes: agg._count._all,
      minutes: agg._sum.durationMinutes ?? 0,
      billed,
      tutorEarnings,
      margin: billed.minus(tutorEarnings),
    };
  };

  const byBilledDesc = (a: ReportBreakdownRow, b: ReportBreakdownRow) =>
    b.billed.comparedTo(a.billed);

  const byTutor = byTutorAgg
    .map((g) => toRow(g.tutorId, tutorNames.get(g.tutorId) ?? "Unknown tutor", g))
    .sort(byBilledDesc);
  const byClient = byClientAgg
    .map((g) => toRow(g.clientId, clientNames.get(g.clientId) ?? "Unknown client", g))
    .sort(byBilledDesc);

  const billed = byTutor.reduce((acc, r) => acc.plus(r.billed), new D(0));
  const tutorEarnings = byTutor.reduce((acc, r) => acc.plus(r.tutorEarnings), new D(0));

  return {
    classes: byTutor.reduce((acc, r) => acc + r.classes, 0),
    minutes: byTutor.reduce((acc, r) => acc + r.minutes, 0),
    billed,
    tutorEarnings,
    margin: billed.minus(tutorEarnings),
    received: receivedAgg._sum.amount ?? zero,
    paidOut: paidOutAgg._sum.amount ?? zero,
    byTutor,
    byClient,
  };
}
