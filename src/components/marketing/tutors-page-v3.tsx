import { Instrument_Serif } from "next/font/google";
import { Grain } from "./v3/grain";
import { SiteHeader } from "./v3/site-header";
import { TutorDirectory } from "./v3/tutor-directory";
import { ChatWidget } from "./v3/chat-widget";
import { EnquiryForm } from "./v3/enquiry-form";

/**
 * Our Tutors — the directory, on the same scrolling chrome as /courses and
 * /testimonials.
 *
 * PHOTOGRAPHS. The three portraits are expected at:
 *
 *   public/tutors/samantha-yershov.jpg
 *   public/tutors/jared.jpg
 *   public/tutors/ella.jpg
 *
 * They are supplied separately from this code and are not in the repository.
 * Until each one is in place its card shows the tutor's initials — deliberately
 * not a stock portrait, which on a page of named people would be a photograph
 * of someone who does not work here. Any reasonable resolution will do; they
 * are cropped to 4:5 from the top and served through next/image.
 *
 * Tutor facts live in v3/tutor-directory.tsx, with a note there about why none
 * of them may be invented.
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

export function TutorsPageV3() {
  return (
    <div
      className={`${editorial.variable} relative flex min-h-[100svh] flex-col overflow-x-hidden selection:bg-[var(--v3-accent)] selection:text-[var(--v3-paper)]`}
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Grain id="v3tu-grain" />

      <SiteHeader active="Tutors" />

      <main className="relative z-10 flex-1 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* ── Masthead ── */}
          <header className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[0.58rem] tracking-[0.26em] uppercase opacity-55">
              Fig. 05 — The faculty
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(2.4rem,7vw,4.8rem)] leading-[0.95] tracking-[-0.02em] text-balance">
              Our tutors.
            </h1>
            {/* Leads with the institutions and the range, which is what a
                parent is scanning for. An earlier draft called the faculty
                "small" and described the tutors as "still students of their own
                subjects" — meant as craft, read as an apology for both the size
                of the practice and the standing of its tutors. */}
            {/* Names the range rather than a list of schools. The list version
                had to be rewritten the moment the roster grew, and it will grow
                again — and with a certified classroom teacher on the faculty,
                "specialists from [universities]" no longer describes everyone. */}
            <p className="mx-auto mt-7 max-w-xl text-[0.95rem] leading-relaxed text-balance opacity-75">
              A certified classroom teacher and specialists from Georgetown,
              Cornell, Penn State, Florida State and the University of Maryland
              — teaching core subjects and advanced coursework from kindergarten
              through college, and preparing students for the SHSAT, SAT, and
              ACT.
            </p>
          </header>

          <div className="mt-14 sm:mt-20">
            <TutorDirectory fontClass={editorial.variable} />
          </div>

          {/* ── Matching ── */}
          <section className="mx-auto mt-20 max-w-2xl border-t border-current/12 pt-14 text-center sm:mt-28">
            <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(1.7rem,4.2vw,2.6rem)] leading-tight tracking-tight text-balance">
              Not sure which tutor is right for you?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-balance opacity-70">
              Tell us what you need help with and we&rsquo;ll match you with the
              right tutor.
            </p>
            <div className="mt-9 flex justify-center">
              {/* Was a mailto. A lead only existed if the visitor had a mail
                  client set up and actually pressed send in it; this one lands
                  in /admin/enquiries either way. */}
              <EnquiryForm
                fontClass={editorial.variable}
                context={{
                  subject: "Tutor match",
                  intro:
                    "Tell us the subject, the grade, and what your student is finding difficult — we'll call you back with the right tutor.",
                }}
                trigger={
                  <button
                    type="button"
                    className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase"
                    style={{ backgroundColor: ACCENT, color: PAPER }}
                  >
                    Find my tutor
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </button>
                }
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-current/12 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-[0.55rem] tracking-[0.18em] uppercase opacity-45 sm:flex-row">
          <span>Borough Prep — Brooklyn, NY</span>
          <span>Fig. 05 — The faculty</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
