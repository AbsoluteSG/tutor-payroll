import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const D = Prisma.Decimal;
const zero = new D(0);

export type TutorBalance = {
  earned: Prisma.Decimal;
  paid: Prisma.Decimal;
  owed: Prisma.Decimal;
};

export type ClientBalance = {
  billed: Prisma.Decimal;
  received: Prisma.Decimal;
  owed: Prisma.Decimal;
};

/** All-time earned / paid / owed for one tutor. Voided classes are excluded. */
export async function getTutorBalance(tutorId: string): Promise<TutorBalance> {
  const [earnedAgg, paidAgg] = await Promise.all([
    prisma.classSession.aggregate({
      where: { tutorId, voided: false },
      _sum: { tutorEarnings: true },
    }),
    prisma.tutorPayment.aggregate({
      where: { tutorId, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);
  const earned = earnedAgg._sum.tutorEarnings ?? zero;
  const paid = paidAgg._sum.amount ?? zero;
  return { earned, paid, owed: earned.minus(paid) };
}

/** All-time billed / received / owed for one client. Voided classes are excluded. */
export async function getClientBalance(clientId: string): Promise<ClientBalance> {
  const [billedAgg, receivedAgg] = await Promise.all([
    prisma.classSession.aggregate({
      where: { clientId, voided: false },
      _sum: { fullCost: true },
    }),
    prisma.clientPayment.aggregate({
      where: { clientId },
      _sum: { amount: true },
    }),
  ]);
  const billed = billedAgg._sum.fullCost ?? zero;
  const received = receivedAgg._sum.amount ?? zero;
  return { billed, received, owed: billed.minus(received) };
}

/** Owed amount per tutor id, for list views (grouped, two queries total). */
export async function getTutorOwedMap(): Promise<Map<string, Prisma.Decimal>> {
  const [earned, paid] = await Promise.all([
    prisma.classSession.groupBy({
      by: ["tutorId"],
      where: { voided: false },
      _sum: { tutorEarnings: true },
    }),
    prisma.tutorPayment.groupBy({
      by: ["tutorId"],
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
  ]);
  const map = new Map<string, Prisma.Decimal>();
  for (const e of earned) map.set(e.tutorId, e._sum.tutorEarnings ?? zero);
  for (const p of paid) {
    map.set(p.tutorId, (map.get(p.tutorId) ?? zero).minus(p._sum.amount ?? zero));
  }
  return map;
}

/** Owed amount per client id, for list views. */
export async function getClientOwedMap(): Promise<Map<string, Prisma.Decimal>> {
  const [billed, received] = await Promise.all([
    prisma.classSession.groupBy({
      by: ["clientId"],
      where: { voided: false },
      _sum: { fullCost: true },
    }),
    prisma.clientPayment.groupBy({
      by: ["clientId"],
      _sum: { amount: true },
    }),
  ]);
  const map = new Map<string, Prisma.Decimal>();
  for (const b of billed) map.set(b.clientId, b._sum.fullCost ?? zero);
  for (const r of received) {
    map.set(r.clientId, (map.get(r.clientId) ?? zero).minus(r._sum.amount ?? zero));
  }
  return map;
}
