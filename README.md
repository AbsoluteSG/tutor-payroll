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

## Marketing site chat

The public pages carry a chat box with two halves.

**The assistant** (`/api/chat`) answers from a closed brief in
`src/lib/chat/knowledge.ts` — the six real tutors, the four courses, the exams —
and is instructed to refuse anything outside it rather than guess. Prices,
schedules, policies and outcomes are listed there as things it does *not* know,
because a model with no price in context will otherwise invent a plausible one.
**When a page changes, change the brief in the same commit**, or the chat box
becomes a second, unreviewed version of the site.

It needs a key:

```bash
ANTHROPIC_API_KEY=sk-ant-...   # add to .env
```

Without it the site still works: the assistant returns 503 with an explanation
and the widget falls through to the human option. It is rate limited per IP,
in memory — see the caveats in `src/lib/chat/rate-limit.ts` before relying on
that across more than one instance.

**Talk to a person** is a real live chat, not a contact form. The visitor joins
a queue; a manager picks them up at **/admin/chat** and the two of them type at
each other. The assistant goes silent for the rest of that conversation — the
server enforces it, so a stale tab can't answer over a human.

A conversation is `BOT` → `WAITING` → `LIVE` → `ENDED` (`ConversationMode`).

**Availability is a heartbeat, not a setting.** While `/admin/chat` is open, that
manager has a row in `StaffPresence` refreshed every few seconds; the site only
promises a live chat when at least one row is fresh. Nobody on? The visitor is
told so plainly and their message plus email is kept for a reply later. Get this
wrong and the widget's worst failure mode is a parent typing into an empty room
at midnight.

**Updates arrive by polling, every 3s, both ends.** Next route handlers have no
websocket server, and an SSE stream would be a serverless function held open per
visitor — with no Redis or pub/sub in the stack it would end up polling Postgres
internally anyway. The reasoning is written out in `src/app/api/chat/poll/route.ts`.
If concurrent chats ever get heavy, that file is the thing to replace.

The conversation id in `sessionStorage` is a bearer token — anyone holding it can
read and post to that chat. It's a cuid, so unguessable in practice, but this is
why nothing sensitive should ever be asked for in the box.

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
