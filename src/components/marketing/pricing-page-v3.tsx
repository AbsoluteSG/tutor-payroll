import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Grain } from "./v3/grain";
import { SiteHeader } from "./v3/site-header";
import { ChatWidget } from "./v3/chat-widget";
import { EnquiryForm } from "./v3/enquiry-form";
import {
  GUARANTEE,
  MEMBERSHIPS,
  TIERS,
  TUTOR_TIER,
  perSession,
} from "./pricing";
import { ROSTER } from "./roster";

/**
 * Pricing, published in full.
 *
 * The page's whole argument is that it exists. Every competing studio in this
 * market makes you ring up for a number, so the differentiator is not the rate
 * — it is that the rate is on a page you can read at eleven at night without
 * giving anyone your phone number. That is why nothing here is behind a form,
 * why the tiers name which tutors are in them, and why the arithmetic on the
 * memberships is shown rather than left as a "save 20%" badge.
 *
 * Tiering is by tutor seniority, not by subject: an English hour and a calculus
 * hour cost the same, and what moves the price is who is teaching it.
 *
 * Set SHOW_PRICING to false in pricing.ts to take all of this off the site.
 */

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";
const ACCENT = "var(--v3-accent)";
const CARD = "var(--v3-card)";

export function PricingPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Grain id="v3pr-grain" />

      <SiteHeader active="Pricing" />

      <main className="relative z-10 flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* ── Masthead ── */}
          <header className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-55">
              Fig. 06 — What it costs
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(2.4rem,7vw,4.8rem)] leading-[0.95] tracking-[-0.02em] text-balance">
              Our rates, in public.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-[0.95rem] leading-relaxed text-balance opacity-75">
              Every rate we charge is on this page. You should not have to ring
              a studio and sit through a consultation to find out what an hour
              of tutoring costs — so here it is, along with what changes it and
              what doesn&rsquo;t.
            </p>
          </header>

          {/* ── Tiers ── */}
          <section className="mt-16 sm:mt-24">
            <SectionHead
              title="I. By tutor, not by subject"
              meta="Three tiers"
            />
            {/* The second sentence is doing the real work. Without it the three
                columns read as a quality ladder with a cheap end, which is both
                wrong and bad for us — four of the six tutors sit below Senior. */}
            <p className="mt-8 max-w-2xl text-[0.95rem] leading-relaxed opacity-75">
              An hour of calculus and an hour of essay work cost the same. What
              moves the price is who is teaching it. These are not good, better
              and best — they are three different jobs, and the one your child
              needs depends on what you are trying to fix. Rates are per hour,
              online.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden border border-current/12 sm:grid-cols-3">
              {TIERS.map((tier) => {
                const tutors = ROSTER.filter(
                  (t) => TUTOR_TIER[t.name] === tier.id
                );
                return (
                  <div
                    key={tier.id}
                    className="flex flex-col bg-current/[0.02] p-6 sm:p-7"
                  >
                    <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase opacity-55">
                      {tier.name}
                    </p>
                    <p className="mt-4 font-[family-name:var(--font-editorial)] text-[3.4rem] leading-none tracking-tight">
                      ${tier.rate}
                      <span className="ml-1.5 font-sans text-[0.8rem] tracking-normal opacity-55">
                        / hour
                      </span>
                    </p>
                    <p className="mt-5 text-[0.88rem] leading-relaxed opacity-75">
                      {tier.who}
                    </p>

                    {/* Who it's for, kept visually distinct from who they are —
                        it answers a different question and a parent scanning
                        three columns should be able to read just this row. */}
                    <div className="mt-5 border-t border-current/12 pt-4">
                      <p className="font-mono text-[0.5rem] tracking-[0.18em] uppercase opacity-50">
                        Right for
                      </p>
                      <p className="mt-2 text-[0.88rem] leading-relaxed opacity-75">
                        {tier.suits}
                      </p>
                    </div>

                    {tutors.length > 0 && (
                      <div className="mt-auto pt-6">
                        <p className="font-mono text-[0.5rem] tracking-[0.18em] uppercase opacity-50">
                          In this tier
                        </p>
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {tutors.map((t) => (
                            <li
                              key={t.name}
                              className="rounded-full border border-current/20 px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.1em] uppercase opacity-80"
                            >
                              {t.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-[0.88rem] leading-relaxed opacity-70">
              Every session is online, one-to-one, and the rate is the same
              wherever your student is. There is no travel surcharge and no
              catchment area — a tutor in Miami teaching a student in Brooklyn
              costs exactly what this page says.
            </p>
          </section>

          {/* ── Memberships ── */}
          <section className="mt-20 border-t border-current/12 pt-14 sm:mt-28">
            <SectionHead title="II. Monthly, not hourly" meta="Memberships" />
            <p className="mt-8 max-w-2xl text-[0.95rem] leading-relaxed opacity-75">
              Tutoring works on a rhythm, so we bill on one. A membership is a
              block of sessions a month at a lower rate than booking them one at
              a time — and it is the arrangement that actually moves a grade,
              because the work carries over week to week instead of restarting.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {MEMBERSHIPS.map((m) => (
                <div
                  key={m.name}
                  className="rounded-[0.7rem] border border-current/12 p-6 sm:p-8"
                  style={{ backgroundColor: CARD }}
                >
                  <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase opacity-55">
                    {m.name}
                  </p>
                  <p className="mt-4 font-[family-name:var(--font-editorial)] text-[3.4rem] leading-none tracking-tight">
                    ${m.price.toLocaleString()}
                    <span className="ml-1.5 font-sans text-[0.8rem] tracking-normal opacity-55">
                      / month
                    </span>
                  </p>
                  <p className="mt-3 font-mono text-[0.55rem] tracking-[0.14em] uppercase opacity-60">
                    {m.sessions} sessions · ${perSession(m)} each
                  </p>
                  <p className="mt-4 text-[0.88rem] leading-relaxed opacity-75">
                    {m.note}
                  </p>
                </div>
              ))}
            </div>

            {/* Memberships cannot be bought on the site yet — they need
                recurring billing, which does not exist in this codebase. Rather
                than leave a price on the page with no way to act on it, this
                routes to a phone call. Replace with a real CTA when Stripe
                Billing lands. */}
            <p className="mt-6 text-[0.88rem] leading-relaxed opacity-70">
              Memberships are arranged over the phone —{" "}
              <EnquiryForm
                fontClass={editorial.variable}
                context={{
                  subject: "Membership enquiry",
                  intro:
                    "Tell us how often your student needs sessions and which subject, and we'll call you to set a membership up.",
                }}
                trigger={
                  <button
                    type="button"
                    className="underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
                    style={{ color: ACCENT }}
                  >
                    ask us to call you
                  </button>
                }
              />
              .
            </p>
          </section>

          {/* ── Guarantee ── */}
          <section className="mt-20 border-t border-current/12 pt-14 sm:mt-28">
            <SectionHead title="III. Before you pay anything" meta="The guarantee" />
            <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-12">
              <div>
                <p className="font-[family-name:var(--font-editorial)] text-[2rem] leading-tight tracking-tight italic">
                  A free diagnostic.
                </p>
                <p className="mt-4 text-[0.92rem] leading-relaxed opacity-75">
                  {GUARANTEE.diagnostic}
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-editorial)] text-[2rem] leading-tight tracking-tight italic">
                  A good-fit promise.
                </p>
                <p className="mt-4 text-[0.92rem] leading-relaxed opacity-75">
                  {GUARANTEE.fit}
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-2xl text-[0.88rem] leading-relaxed opacity-65">
              We don&rsquo;t give away free sessions. A free hour tells you
              almost nothing about whether a tutor is right for your child, and
              it is paid for somewhere — usually in the rate everyone else is
              charged.
            </p>
          </section>

          {/* ── CTA ── */}
          <section className="mx-auto mt-20 max-w-2xl border-t border-current/12 pt-14 text-center sm:mt-28">
            <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(1.7rem,4.2vw,2.6rem)] leading-tight tracking-tight text-balance">
              Start with the diagnostic.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-70">
              It costs nothing, and it is the only honest way to tell you what
              the work actually is.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {/* The diagnostic is not self-serve bookable — it is free, and
                  Stripe cannot take a $0 checkout — so it goes through the
                  enquiry form and someone arranges it on the phone. */}
              <EnquiryForm
                fontClass={editorial.variable}
                context={{
                  subject: "Free diagnostic",
                  intro:
                    "The diagnostic is free and there's no obligation. Tell us the exam or subject and we'll call you to arrange a time.",
                }}
                trigger={
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase"
                    style={{ backgroundColor: ACCENT, color: PAPER }}
                  >
                    Book a diagnostic
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </button>
                }
              />
              <Link
                href="/tutors"
                className="inline-flex items-center rounded-full border border-current/25 px-7 py-3.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
              >
                Meet the tutors
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-current/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 06 — What it costs</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}

function SectionHead({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-current/12 pb-4">
      <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(1.6rem,4vw,2.4rem)] leading-none tracking-tight">
        {title}
      </h2>
      <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase opacity-55">
        {meta}
      </p>
    </div>
  );
}
