# Tutor Payroll

A small bookkeeping web app that replaces a shared timesheet spreadsheet.

- **Tutors** log in, submit classes (client, student, date, duration, full cost — their preset rate fills in automatically), and watch their balance (earned / paid / owed).
- **The manager** creates clients (keyed by *payment name*, e.g. the name on incoming Zelle payments), assigns per-client rates to each tutor, records incoming client payments, voids mistaken submissions, and pays tutors — either by recording a manual payout or with one click via **Stripe Connect**.

Works in any browser (Mac, Windows, phones).

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 + PostgreSQL · Auth.js v5 (credentials + invite links) · Tailwind + shadcn/ui · Stripe Connect (Express accounts + Transfers)

## Local development

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate dev      # create tables
SEED_SAMPLE_DATA=1 npm run seed   # manager + demo data
npm run dev
```

Seed accounts (dev): manager `siphongames.dev@gmail.com` / `admin1234`, tutor `tutor@example.com` / `tutor1234`.
Set `SEED_MANAGER_PASSWORD` before seeding production.

Tests & checks: `npm test` · `npm run typecheck` · `npm run lint`

## How money flows

- Submitting a class **snapshots** the rate-card rate and stores `tutorEarnings = rate × hours`; changing a rate later never rewrites history.
- Balances are always computed from the ledger: tutor `owed = Σ earnings − Σ paid payouts`; client `owes = Σ full cost − Σ recorded payments`. Voided classes drop out of every sum but stay visible.
- Client payments (Zelle etc.) are recorded manually on the client's profile.

## Stripe Connect setup (payouts)

1. Create a Stripe account, enable **Connect** with **Express** accounts.
2. Put the test-mode secret key in `STRIPE_SECRET_KEY`.
3. Webhook: locally run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   and copy the printed secret into `STRIPE_WEBHOOK_SECRET`. In production, add a webhook endpoint for `account.updated` and `transfer.reversed` pointing at `https://<your-domain>/api/webhooks/stripe`.
4. Each tutor visits **Payouts → Connect bank account** and completes Stripe's hosted onboarding.
5. On a tutor's admin profile, **Pay $X** transfers from your platform Stripe balance to the tutor. **Your Stripe balance must be funded** (Stripe supports ACH top-ups) because client money arrives outside Stripe.

Tutors who skip onboarding can still be paid outside the app and tracked with **Record manual payment**.

## Deployment

Either of:

- **Railway**: create a project with a Postgres plugin + this repo. Set the env vars from `.env.example`. Build runs `next build`; run `npx prisma migrate deploy` as a release step.
- **Vercel + Neon**: import the repo into Vercel, add a Neon Postgres database, set env vars, and run `npx prisma migrate deploy` against the Neon URL.

Then seed the manager account: `SEED_MANAGER_PASSWORD=<strong password> npm run seed` (omit `SEED_SAMPLE_DATA`).
