-- Parent sign-in, hung off Client rather than a second User row.
--
-- Both nullable: a client typed in by a manager has no login and most never
-- will. An account exists only once a parent sets a password on their booking
-- confirmation page. Sign-in requires "email" AND "passwordHash", so existing
-- rows are unaffected and simply cannot log in.
ALTER TABLE "Client" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Client" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- The sign-in lookup: by email, among clients that actually have a login.
-- Partial, because the overwhelming majority of rows never will.
CREATE INDEX "Client_login_idx"
  ON "Client" ("email") WHERE "passwordHash" IS NOT NULL;
