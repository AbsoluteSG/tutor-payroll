import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { Grain } from "./v3/grain";
import { SiteHeader } from "./v3/site-header";
import { ChatWidget } from "./v3/chat-widget";

/**
 * About — a placeholder, and honest about being one.
 *
 * The nav previously carried "Method" and "About" both pointing at "/", so
 * clicking either silently reloaded the home page. "Method" is gone; this is
 * where About now goes.
 *
 * Deliberately says the page is being written rather than inventing a founding
 * story. Everything on this site about the practice and its tutors is true, and
 * a plausible-sounding history is exactly the kind of copy that survives to
 * launch because nobody remembers it was filler. Replace this with the real
 * thing — see the note in the middle of the file.
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

export function AboutPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Grain id="v3a-grain" />

      <SiteHeader active="About" />

      <main className="relative z-10 flex flex-1 items-center px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-55">
            Fig. 06 — The practice
          </p>

          <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(2.4rem,7vw,4.8rem)] leading-[0.95] tracking-[-0.02em] text-balance">
            Still being
            <br />
            written.
          </h1>

          {/* ── REPLACE THIS ──
              What belongs here: who runs the practice, why it exists, and how
              it teaches. It is the one page a parent reads to decide whether
              these are serious people. Nothing on it may be invented — see the
              same rule in v3/tutor-directory.tsx. */}
          <p className="mx-auto mt-8 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-75">
            We would rather leave this page empty than fill it with something
            that sounds right. The story of the practice is being written
            properly and will be here shortly.
          </p>

          <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-75">
            In the meantime, the tutors are real, the rates are published, and
            anything you want to ask gets answered by a person.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tutors"
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase"
              style={{ backgroundColor: ACCENT, color: PAPER }}
            >
              Meet the tutors
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <a
              href="mailto:hello@boroughprep.com?subject=Question%20about%20Borough%20Prep"
              className="inline-flex items-center rounded-full border border-current/25 px-7 py-3.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors hover:border-current/60"
            >
              Ask us anything
            </a>
          </div>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-current/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 06 — The practice</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
