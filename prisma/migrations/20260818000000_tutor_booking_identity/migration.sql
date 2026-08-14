-- CreateEnum
CREATE TYPE "TutorTier" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

-- AlterTable
-- Every column is nullable or defaulted, so existing rows need no backfill and
-- nothing that works today stops working. A tutor becomes bookable only once a
-- manager has set slug, tier and defaultTutorRate — see lib/booking/tutors.ts.
ALTER TABLE "User" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tier" "TutorTier",
ADD COLUMN     "defaultTutorRate" DECIMAL(10,2),
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
ADD COLUMN     "bookable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
