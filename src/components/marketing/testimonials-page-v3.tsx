import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Grain } from "./v3/grain";
import { SiteHeader } from "./v3/site-header";
import { TestimonialWall } from "./v3/testimonial-wall";
import { ChatWidget } from "./v3/chat-widget";

/**
 * Testimonials, in the /v3 paper-and-ink system.
 *
 * An ordinary scrolling document rather than the fixed-viewport sequence the
 * subject pages use: a visitor here is comparing accounts and looking for the
 * one that sounds like their own child, which wants scanning and a scrollbar,
 * not seven crossfading panels they have to advance through in order.
 *
 * The quotations themselves are placeholder and must not ship as-is — see the
 * note in v3/testimonial-wall.tsx.
 */

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
});

const PAPER = "var(--v3-paper)";
const INK = "var(--v3-ink)";

export function TestimonialsPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Grain id="v3t-grain" />

      <SiteHeader active="Testimonials" />

      <main className="relative z-10 flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* ── Masthead ── */}
          <header className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-55">
              Fig. 04 — Accounts
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(2.4rem,7vw,4.8rem)] leading-[0.95] tracking-[-0.02em] text-balance">
              What families
              <br />
              tell us after.
            </h1>
            <p className="mx-auto mt-7 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-70">
              Unedited except for length, and published with permission. Where a
              family asked to stay anonymous, we have left them so.
            </p>
          </header>

          <div className="mt-14 sm:mt-20">
            <TestimonialWall />
          </div>

          {/* ── Closing ── */}
          <section className="mx-auto mt-20 max-w-2xl border-t border-current/12 pt-14 text-center sm:mt-28">
            <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(1.6rem,4vw,2.4rem)] leading-tight tracking-tight text-balance">
              The next one of these is up to your student.
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/courses"
                className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
                style={{ backgroundColor: INK, color: PAPER }}
              >
                View courses
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
              <a
                href="mailto:hello@boroughprep.com?subject=Tutoring%20enquiry"
                className="inline-flex items-center rounded-full border border-current/25 px-6 py-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
              >
                Ask a question
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-current/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 04 — Accounts</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
