import type { CSSProperties } from "react";
import { HudReadout } from "./v4/hud-readout";
import { Reticle } from "./v4/reticle";

/**
 * "Open Signal" — a dark, instrument-panel treatment of the same brief.
 * Fully self-contained colour system (explicit hex throughout) so it never
 * inherits the app's admin theme tokens.
 *
 * Imagery is public domain and served locally from /public/v4:
 *   carina-nebula.jpg   — NASA / ESA / Hubble Heritage Team (STScI/AURA)
 *   celestial-chart.jpg — Andreas Cellarius, Harmonia Macrocosmica, c. 1660
 *
 * Copy is placeholder. The ACCESS section states principles deliberately, not
 * specific programmes or prices — confirm real offerings before publishing.
 */

const VOID = "#05070B";
const SIGNAL = "#39FF9E";

// Hairline HUD graticule laid over the hero.
const GRATICULE: CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)
  `,
  backgroundSize: "88px 88px",
};

const SCANLINES: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 1px, transparent 1px, transparent 4px)",
  backgroundSize: "100% 4px",
};

const DISCIPLINES = [
  { code: "MTH—01", name: "Mathematics", range: "Pre-algebra → Calculus" },
  { code: "LNG—02", name: "Reading & Writing", range: "Close reading → Argument" },
  { code: "SCI—03", name: "Sciences", range: "Biology → Physics" },
  { code: "EXM—04", name: "Examinations", range: "SAT / ACT / Subject" },
  { code: "MTD—05", name: "Study Practice", range: "Attention → Method" },
  { code: "WLD—06", name: "Languages", range: "Spanish / French / Latin" },
];

const TENETS = [
  "Knowledge is not scarce",
  "Access is",
  "So we work on access",
];

const GRADES = ["06", "07", "08", "09", "10", "11", "12"];

export function LandingPageV4() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans selection:bg-[#39FF9E] selection:text-black"
      style={{ backgroundColor: VOID, color: "#E8EAF0" }}
    >
      {/* Sensor grain over the entire document. */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.22] mix-blend-overlay"
      >
        <filter id="v4-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#v4-grain)" />
      </svg>

      {/* Drifting scanlines. */}
      <div
        aria-hidden
        className="v4-scan pointer-events-none fixed inset-0 z-40 opacity-[0.5]"
        style={SCANLINES}
      />

      {/* ───────────────────────── Top bar ───────────────────────── */}
      <header className="relative z-30 flex flex-col gap-3 border-b border-white/10 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[0.72rem] tracking-[0.3em] uppercase">
            Borough&nbsp;Prep
          </span>
          <span className="hidden font-mono text-[0.55rem] tracking-[0.2em] text-white/35 uppercase sm:inline">
            {"/// Open Knowledge Protocol"}
          </span>
        </div>
        <HudReadout />
      </header>

      {/* ─────────────────────────── Hero ─────────────────────────── */}
      <section
        id="v4-hero"
        className="relative flex min-h-[calc(100svh-3.6rem)] flex-col justify-center overflow-hidden px-5 py-20 sm:px-8"
      >
        {/* Deep-field plate, pushed almost entirely to black. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/v4/carina-nebula.jpg')",
            filter: "grayscale(1) contrast(1.5) brightness(0.34)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(5,7,11,0.35) 0%, rgba(5,7,11,0.82) 58%, ${VOID} 88%)`,
          }}
        />
        <div aria-hidden className="absolute inset-0" style={GRATICULE} />

        {/* Registration marks at the graticule intersections. */}
        {[
          { top: "18%", left: "12%" },
          { top: "18%", right: "12%" },
          { bottom: "22%", left: "22%" },
          { bottom: "30%", right: "18%" },
        ].map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute font-mono text-[0.7rem] leading-none text-white/25 select-none"
            style={p}
          >
            +
          </span>
        ))}

        <Reticle />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <p className="font-mono text-[0.6rem] tracking-[0.28em] text-white/45 uppercase">
            Transmission 01 — The premise
          </p>

          {/* Hero glyph with chromatic aberration. */}
          <h1 className="relative mt-6 text-[clamp(2.9rem,13.5vw,11rem)] leading-[0.9] font-extralight tracking-[0.06em] whitespace-nowrap">
            <span
              aria-hidden
              className="v4-aberr-a absolute inset-0 text-[#FF2D5E] mix-blend-screen"
            >
              UNGATED
            </span>
            <span
              aria-hidden
              className="v4-aberr-b absolute inset-0 text-[#00E5FF] mix-blend-screen"
            >
              UNGATED
            </span>
            <span className="relative">UNGATED</span>
          </h1>

          {/* Instrument caption block. */}
          <div className="mt-9 max-w-xl">
            <p
              className="inline-flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.22em] uppercase"
              style={{ color: SIGNAL }}
            >
              <span>+</span> Knowledge transfer
            </p>
            <div className="mt-3 space-y-1">
              {[
                "One student paired with one tutor who sees them —",
                "regardless of zip code, income, or starting point.",
                "Knowledge is not scarce. Access is. We work on access.",
              ].map((line) => (
                <p
                  key={line}
                  className="w-fit bg-black/55 px-2 py-1 font-mono text-[0.63rem] leading-relaxed tracking-[0.12em] text-white/70 uppercase backdrop-blur-[1px]"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Grade axis — the range we serve, drawn as an instrument scale. */}
          <div className="mt-12 max-w-md">
            <div className="flex items-end justify-between font-mono text-[0.55rem] tracking-[0.16em] text-white/40 tabular-nums">
              {GRADES.map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>
            <div className="mt-1.5 h-px w-full bg-white/20" />
            <p className="mt-2 font-mono text-[0.53rem] tracking-[0.2em] text-white/30 uppercase">
              Grades served
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href="#channel"
              className="group inline-flex items-center gap-3 border border-white/25 px-6 py-3 font-mono text-[0.65rem] tracking-[0.2em] uppercase transition-colors hover:border-[#39FF9E] hover:text-[#39FF9E]"
            >
              Open a channel
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </a>
            <a
              href="#disciplines"
              className="font-mono text-[0.65rem] tracking-[0.2em] text-white/50 uppercase underline decoration-white/20 underline-offset-[6px] transition-colors hover:text-white hover:decoration-white/60"
            >
              Read the manifest
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Tenet ticker ─────────────────────── */}
      <section
        aria-hidden
        className="relative z-10 flex overflow-hidden border-y border-white/10 bg-black/40 py-3"
      >
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {TENETS.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-6 px-6 font-mono text-[0.7rem] tracking-[0.24em] whitespace-nowrap text-white/55 uppercase"
                >
                  {t}
                  <span
                    className="inline-block size-1 rounded-full"
                    style={{ backgroundColor: SIGNAL }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────── Transmission 02 ───────────────────── */}
      <section className="relative z-10 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-center">
          <div data-reveal>
            <p className="font-mono text-[0.6rem] tracking-[0.28em] text-white/40 uppercase">
              Transmission 02 — Inheritance
            </p>
            <h2 className="mt-6 text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.08] font-light tracking-tight text-balance">
              Every map of the heavens was once
              <span style={{ color: SIGNAL }}> classified</span>.
            </h2>
            <div className="mt-7 space-y-4 text-[0.9rem] leading-relaxed text-white/60">
              <p>
                For most of history, knowing how the sky moved was a credential
                — held by courts, guilds, and clergy, and withheld from everyone
                else. What was once restricted is now printed in a schoolbook.
              </p>
              <p>
                That is the only direction knowledge has ever travelled: outward.
                We think tutoring should push the same way — not as a private
                advantage for the few who can find it, but as a way of handing
                over what somebody already knows.
              </p>
            </div>
          </div>

          {/* Cellarius plate, treated as a scanned instrument reading. */}
          <div data-reveal className="relative">
            <div className="relative aspect-4/3 overflow-hidden border border-white/12">
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/v4/celestial-chart.jpg')",
                  filter:
                    "grayscale(1) contrast(1.35) brightness(0.62) invert(1)",
                  mixBlendMode: "screen",
                  opacity: 0.72,
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, transparent 30%, rgba(5,7,11,0.72) 100%)",
                }}
              />
              <div aria-hidden className="absolute inset-0" style={GRATICULE} />

              {/* Plate annotations. */}
              <span className="absolute top-3 left-3 font-mono text-[0.53rem] tracking-[0.2em] text-white/50 uppercase">
                Fig. 02 — Harmonia Macrocosmica
              </span>
              <span className="absolute right-3 bottom-3 font-mono text-[0.53rem] tracking-[0.2em] text-white/50 uppercase tabular-nums">
                c. 1660 / Public domain
              </span>
              <span
                className="v4-flicker absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{ borderColor: SIGNAL }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── Disciplines ────────────────────── */}
      <section
        id="disciplines"
        className="relative z-10 border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <div
            data-reveal
            className="flex items-baseline justify-between border-b border-white/20 pb-4"
          >
            <h2 className="font-mono text-[0.72rem] tracking-[0.3em] uppercase">
              Manifest — Disciplines
            </h2>
            <span className="font-mono text-[0.55rem] tracking-[0.2em] text-white/35 uppercase tabular-nums">
              06 channels
            </span>
          </div>

          <ul>
            {DISCIPLINES.map((d) => (
              <li
                key={d.code}
                data-reveal
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-b border-white/8 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[7rem_1fr_auto] sm:gap-x-10"
              >
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-white/40 tabular-nums">
                  {d.code}
                </span>
                <span className="text-[1.4rem] font-light tracking-tight sm:text-[1.9rem]">
                  {d.name}
                </span>
                <span className="col-start-2 mt-1.5 font-mono text-[0.58rem] tracking-[0.14em] text-white/40 uppercase sm:col-start-3 sm:mt-0 sm:text-right">
                  {d.range}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ──────────────────── Access protocol ──────────────────── */}
      <section className="relative z-10 overflow-hidden px-5 py-28 sm:px-8 sm:py-36">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(57,255,158,0.055) 0%, transparent 70%)`,
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-mono text-[0.6rem] tracking-[0.28em] text-white/40 uppercase">
            Transmission 03 — Access protocol
          </p>
          <blockquote
            data-reveal
            className="mt-8 text-[clamp(1.7rem,5vw,3.2rem)] leading-[1.12] font-light tracking-tight text-balance"
          >
            A student who was never given the question cannot be said to have
            failed <span className="italic" style={{ color: SIGNAL }}>the answer</span>.
          </blockquote>
          <p className="mx-auto mt-8 max-w-lg font-mono text-[0.63rem] leading-relaxed tracking-[0.12em] text-white/50 uppercase">
            We build our roster to reach students who are usually routed around.
            If cost is the obstacle, say so when you write — we would rather
            solve it than lose the student.
          </p>
        </div>
      </section>

      {/* ───────────────────────── Channel ───────────────────────── */}
      <section
        id="channel"
        className="relative z-10 border-t border-white/10 px-5 py-28 sm:px-8 sm:py-36"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[0.6rem] tracking-[0.28em] uppercase" style={{ color: SIGNAL }}>
            Channel open — accepting students
          </p>
          <h2
            data-reveal
            className="mt-8 text-[clamp(2.2rem,8vw,5.4rem)] leading-[0.95] font-extralight tracking-[0.02em] text-balance"
          >
            Transmit a signal.
          </h2>
          <a
            href="mailto:hello@boroughprep.com"
            className="group mt-12 inline-flex items-center gap-3 border px-7 py-3.5 font-mono text-[0.66rem] tracking-[0.2em] uppercase transition-colors"
            style={{ borderColor: SIGNAL, color: SIGNAL }}
          >
            hello@boroughprep.com
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 font-mono text-[0.55rem] tracking-[0.18em] text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>Borough Prep — Brooklyn, NY</span>
          <span className="text-white/25">
            Plates: NASA/ESA Hubble · Cellarius c. 1660 — public domain
          </span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
