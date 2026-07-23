-- CreateEnum
CREATE TYPE "ScheduledClassStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "ScheduledClass" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "ScheduledClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledClass_tutorId_scheduledAt_idx" ON "ScheduledClass"("tutorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledClass_clientId_scheduledAt_idx" ON "ScheduledClass"("clientId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "ScheduledClass" ADD CONSTRAINT "ScheduledClass_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledClass" ADD CONSTRAINT "ScheduledClass_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
