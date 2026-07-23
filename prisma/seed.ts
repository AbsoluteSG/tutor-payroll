import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const D = (v: string | number) => new Prisma.Decimal(v);

async function main() {
  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? "admin1234";
  const manager = await prisma.user.upsert({
    where: { email: "siphongames.dev@gmail.com" },
    update: {},
    create: {
      email: "siphongames.dev@gmail.com",
      name: "Manager",
      role: "MANAGER",
      passwordHash: await bcrypt.hash(managerPassword, 10),
    },
  });
  console.log(`Manager: ${manager.email} (password: ${managerPassword})`);

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
