-- CreateTable
-- Weekday + minute-of-day in the tutor's own zone, never a UTC instant: see the
-- doc comment on AvailabilityRule for why (DST would drift stored instants).
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityRule_tutorId_weekday_idx" ON "AvailabilityRule"("tutorId", "weekday");

-- CreateIndex
CREATE INDEX "AvailabilityException_tutorId_date_idx" ON "AvailabilityException"("tutorId", "date");

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sanity bounds. A rule outside a day, or inverted, produces nonsense slots
-- rather than an error, so it is rejected at the database as well as in the
-- server action.
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_sane_window"
  CHECK ("weekday" BETWEEN 0 AND 6
     AND "startMinute" >= 0
     AND "endMinute" <= 1440
     AND "startMinute" < "endMinute");
