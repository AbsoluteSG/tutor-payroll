-- How long a tutor has been teaching, in whole years.
--
-- Nullable on purpose: a tutor who has not said gets no line on their card
-- rather than a guess or a zero, which would read as "no experience".
ALTER TABLE "User" ADD COLUMN "yearsTutoring" INTEGER;
