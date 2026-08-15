import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const D = (v: string | number) => new Prisma.Decimal(v);

async function main() {
  // Email and password both come from the environment. They used to be a
  // hardcoded address and "admin1234", which is fine for a scratch database and
  // exactly wrong for a real one — the account that owns every client record
  // should not have a password that is written down in a repository.
  const managerEmail = process.env.SEED_MANAGER_EMAIL;
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;

  if (!managerEmail || !managerPassword) {
    console.error(
      "Set SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD before seeding, e.g.\n" +
        '  $env:SEED_MANAGER_EMAIL="you@example.com"\n' +
        '  $env:SEED_MANAGER_PASSWORD="a-long-password"\n' +
        "  npm run seed"
    );
    process.exitCode = 1;
    return;
  }

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { username: "admin", role: "MANAGER" },
    create: {
      email: managerEmail,
      username: "admin",
      name: process.env.SEED_MANAGER_NAME ?? "Manager",
      role: "MANAGER",
      passwordHash: await bcrypt.hash(managerPassword, 10),
    },
  });
  // The password is never echoed — whoever ran this already knows it.
  console.log(`Manager: ${manager.email}`);

  if (process.env.SEED_SAMPLE_DATA !== "1") return;

  // --- Sample data for dev ---
  const tutor = await prisma.user.upsert({
    where: { email: "tutor@example.com" },
    update: {},
    create: {
      email: "tutor@example.com",
      name: "Taylor Tutor",
      role: "TUTOR",
      passwordHash: await bcrypt.hash("tutor1234", 10),
    },
  });

  // ── Bookable tutors ───────────────────────────────────────────────────────
  // Public booking needs more than a tutor account. The listing gate in
  // lib/booking/tutors.ts requires a slug (to tie the row to its roster entry),
  // a tier (to price the session), a defaultTutorRate (so commit can build the
  // RateCard the tutor needs to log the class afterwards), and the manager's
  // explicit `bookable`. On top of that, /api/booking/slots returns nothing
  // without at least one AvailabilityRule.
  //
  // Miss any one and the flow fails silently in a different place — no tutors
  // offered, or a tutor with no times, or a 404 at checkout. Seeding them is
  // what makes the booking flow exercisable end to end on a fresh database.
  //
  // The slugs must match entries in components/marketing/roster.ts: the booking
  // panel joins the two, the roster supplying the face and the copy and this
  // supplying the identity and the money.
  const BOOKABLE_TUTORS: {
    slug: string;
    name: string;
    email: string;
    tier: "JUNIOR" | "MID" | "SENIOR";
    tutorRate: Prisma.Decimal;
  }[] = [
    { slug: "jared", name: "Jared", email: "jared@example.com", tier: "SENIOR", tutorRate: D(60) },
    {
      slug: "samantha-yershov",
      name: "Samantha Yershov",
      email: "samantha@example.com",
      tier: "MID",
      tutorRate: D(45),
    },
  ];

  /** Weekday afternoons and Saturday mornings, in the tutor's own zone. */
  const WEEKLY_AVAILABILITY = [
    ...[1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      startMinute: 16 * 60,
      endMinute: 20 * 60,
    })),
    { weekday: 6, startMinute: 10 * 60, endMinute: 14 * 60 },
  ];

  for (const t of BOOKABLE_TUTORS) {
    const bookingFields = {
      name: t.name,
      role: "TUTOR" as const,
      active: true,
      bookable: true,
      slug: t.slug,
      tier: t.tier,
      defaultTutorRate: t.tutorRate,
      timeZone: "America/New_York",
    };
    const row = await prisma.user.upsert({
      where: { email: t.email },
      // Also on update, so re-running repairs a tutor seeded before these
      // columns existed rather than leaving them unbookable.
      update: bookingFields,
      create: {
        email: t.email,
        passwordHash: await bcrypt.hash("tutor1234", 10),
        ...bookingFields,
      },
    });

    // Replaced rather than appended: re-running the seed must not stack
    // duplicate windows, which would offer the same slot twice.
    await prisma.availabilityRule.deleteMany({ where: { tutorId: row.id } });
    await prisma.availabilityRule.createMany({
      data: WEEKLY_AVAILABILITY.map((w) => ({ tutorId: row.id, ...w })),
    });
    console.log(`Bookable tutor: ${t.name} (/${t.slug}) — weekdays 4–8pm, Sat 10am–2pm ET`);
  }

  const smith = await prisma.client.upsert({
    where: { paymentName: "John Smith" },
    update: {},
    create: { paymentName: "John Smith", displayName: "Smith family" },
  });
  const garcia = await prisma.client.upsert({
    where: { paymentName: "Maria Garcia" },
    update: {},
    create: { paymentName: "Maria Garcia" },
  });

  await prisma.rateCard.upsert({
    where: { clientId_tutorId: { clientId: smith.id, tutorId: tutor.id } },
    update: {},
    create: { clientId: smith.id, tutorId: tutor.id, tutorRate: D(30), defaultFullCost: D(60) },
  });
  await prisma.rateCard.upsert({
    where: { clientId_tutorId: { clientId: garcia.id, tutorId: tutor.id } },
    update: {},
    create: { clientId: garcia.id, tutorId: tutor.id, tutorRate: D(35), defaultFullCost: D(70) },
  });

  const existing = await prisma.classSession.count();
  if (existing === 0) {
    await prisma.classSession.createMany({
      data: [
        {
          tutorId: tutor.id, clientId: smith.id, studentName: "Emma Smith",
          date: new Date("2026-07-20"), durationMinutes: 60,
          fullCost: D(60), tutorRate: D(30), tutorEarnings: D(30),
        },
        {
          tutorId: tutor.id, clientId: smith.id, studentName: "Liam Smith",
          date: new Date("2026-07-21"), durationMinutes: 90,
          fullCost: D(90), tutorRate: D(30), tutorEarnings: D(45),
        },
        {
          tutorId: tutor.id, clientId: garcia.id, studentName: "Sofia Garcia",
          date: new Date("2026-07-22"), durationMinutes: 60,
          fullCost: D(70), tutorRate: D(35), tutorEarnings: D(35),
        },
      ],
    });
    await prisma.clientPayment.create({
      data: { clientId: smith.id, amount: D(100), method: "ZELLE", note: "Zelle 7/21" },
    });
    await prisma.tutorPayment.create({
      data: { tutorId: tutor.id, amount: D(50), method: "MANUAL", status: "PAID", note: "Zelle payout" },
    });
    console.log("Sample data created (tutor@example.com / tutor1234)");
  }
}

main().finally(() => prisma.$disconnect());
