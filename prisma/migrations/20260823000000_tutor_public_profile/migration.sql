-- The whole public tutor profile, moved out of source and into the database.
--
-- It used to live in a hand-written TypeScript file, with two consequences: an
-- empty database still rendered six tutors on the public site, and a real tutor
-- could not appear without someone editing code and redeploying. Now every
-- tutor the site shows is a row, and `bookable` decides whether it is shown.
ALTER TABLE "User" ADD COLUMN "courses"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "education"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "testPrep"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "levels"      TEXT;
ALTER TABLE "User" ADD COLUMN "photoUrl"    TEXT;
ALTER TABLE "User" ADD COLUMN "photoAlt"    TEXT;

-- The directory's query: published tutors, for a given subject page.
CREATE INDEX "User_published_idx" ON "User" ("bookable") WHERE "bookable";
