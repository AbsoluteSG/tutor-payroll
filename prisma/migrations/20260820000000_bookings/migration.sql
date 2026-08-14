-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PARTIAL', 'UNFULFILLED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BookingSlotStatus" AS ENUM ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELED', 'CONFLICTED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "ClientPayment" ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "bookingId" TEXT;

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "tutorId" TEXT NOT NULL,
    "clientId" TEXT,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "studentName" TEXT NOT NULL,
    "studentGrade" TEXT,
    "subject" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "notes" TEXT,
    "tier" "TutorTier" NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2),
    "bookedTimeZone" TEXT NOT NULL,
    "patternLabel" TEXT,
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "holdExpiresAt" TIMESTAMP(3) NOT NULL,
    "needsAttention" BOOLEAN NOT NULL DEFAULT false,
    "unfulfilledAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "attentionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSlot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "BookingSlotStatus" NOT NULL DEFAULT 'HELD',
    "releasedAt" TIMESTAMP(3),
    "releasedReason" TEXT,
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "scheduledClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPayment_stripeRefundId_key" ON "ClientPayment"("stripeRefundId");

-- CreateIndex
CREATE INDEX "ClientPayment_bookingId_idx" ON "ClientPayment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "Booking"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_tutorId_createdAt_idx" ON "Booking"("tutorId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_clientId_createdAt_idx" ON "Booking"("clientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSlot_scheduledClassId_key" ON "BookingSlot"("scheduledClassId");

-- CreateIndex
CREATE INDEX "BookingSlot_bookingId_startsAt_idx" ON "BookingSlot"("bookingId", "startsAt");

-- CreateIndex
CREATE INDEX "BookingSlot_tutorId_startsAt_idx" ON "BookingSlot"("tutorId", "startsAt");

-- AddForeignKey
ALTER TABLE "ClientPayment" ADD CONSTRAINT "ClientPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_scheduledClassId_fkey" FOREIGN KEY ("scheduledClassId") REFERENCES "ScheduledClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Everything below is hand-written. Prisma cannot express any of it, and none
-- of it appears in schema.prisma — a `prisma db push` would drop the lot
-- silently. Use `migrate dev` / `migrate deploy` only.
-- ═══════════════════════════════════════════════════════════════════════════

-- Needed for an exclusion constraint that mixes an equality (tutorId) with a
-- range overlap. Managed Postgres (Neon, Supabase, RDS) all allow this; if a
-- host does not, fall back to the plain unique index at the bottom of this file
-- and accept that same-start collisions are caught but overlaps are not.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- THE DOUBLE-SELL GUARD.
--
-- The invariant is non-overlap, not equal-start: a 90-minute class at 4:00 and
-- a 60-minute class at 4:30 have different start times and would both pass a
-- unique index while overlapping by half an hour.
--
-- `[)` is half-open, so a slot ending at 4:00 does not collide with one
-- starting at 4:00. `releasedAt IS NULL` is the liveness predicate — see the
-- CHECK below for why that rather than a list of statuses.
--
-- tsrange, NOT tstzrange. These columns are TIMESTAMP(3) — Prisma's mapping for
-- DateTime, and what every other timestamp in this schema is. Handing a
-- `timestamp` to tstzrange() makes Postgres cast it using the session's
-- TimeZone, which is STABLE rather than IMMUTABLE, and an index expression may
-- not be stable: the constraint is rejected outright with 42P17. The values are
-- all UTC instants written by Prisma, so they share one frame and comparing
-- them as naive timestamps gives exactly the intended overlap semantics.
ALTER TABLE "BookingSlot"
  ADD CONSTRAINT "BookingSlot_no_overlap"
  EXCLUDE USING gist (
    "tutorId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("releasedAt" IS NULL);

-- Keeps `releasedAt` and `status` from drifting apart.
--
-- The guard's predicate deliberately does not enumerate statuses: a new status
-- omitted from such a list would either block the calendar forever or permit a
-- double-sell, and neither would raise anything. With this CHECK, forgetting to
-- set `releasedAt` fails the write immediately and loudly instead.
ALTER TABLE "BookingSlot"
  ADD CONSTRAINT "BookingSlot_released_matches_status"
  CHECK ( ("releasedAt" IS NULL) = ("status" IN ('HELD', 'CONFIRMED')) );

-- A slot must end after it starts, or the range above is empty and excludes
-- nothing.
ALTER TABLE "BookingSlot"
  ADD CONSTRAINT "BookingSlot_ends_after_start"
  CHECK ("endsAt" > "startsAt");

-- Ordered range scans for the availability query. The GiST index backing the
-- constraint answers containment, not "the next N starts for this tutor".
CREATE INDEX "BookingSlot_live_calendar_idx"
  ON "BookingSlot" ("tutorId", "startsAt") WHERE "releasedAt" IS NULL;

-- The admin action queue: paid bookings that did not fully provision.
CREATE INDEX "Booking_attention_idx"
  ON "Booking" ("createdAt") WHERE "needsAttention";

-- The hold reaper.
CREATE INDEX "Booking_reaper_idx"
  ON "Booking" ("holdExpiresAt") WHERE "status" = 'PENDING';
