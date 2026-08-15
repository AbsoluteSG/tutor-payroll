-- What a tutor tells us about themselves when they accept an invite.
--
-- None of this publishes anything on its own. `bookable` remains the manager's
-- decision and is still the gate; these columns only reach the public site once
-- it is set. Tier and pay rate are deliberately NOT here: they are what the
-- client pays and what the tutor earns, and neither is the tutor's to set.
ALTER TABLE "User" ADD COLUMN "onboardedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "headline" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "subjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- The manager's queue: tutors who have finished onboarding but are not live.
CREATE INDEX "User_awaiting_publish_idx"
  ON "User" ("onboardedAt") WHERE "onboardedAt" IS NOT NULL AND NOT "bookable";

-- Existing tutors predate onboarding and must not be herded into the welcome
-- form on their next sign-in: they are already working, and a wizard demanding
-- a bio before they can log a class would block real work.
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "role" = 'TUTOR';
