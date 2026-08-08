import { Fraunces } from "next/font/google";
import {
  Sparkles,
  ShieldCheck,
  CalendarClock,
  TrendingUp,
  Calculator,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Brain,
  Globe,
  ArrowRight,
} from "lucide-react";

// Distinct, fully custom design for this variant — deliberately not using
// the app's dark admin theme tokens (bg-background/text-foreground) so it
// reads as a standalone premium marketing page. Explicit colors throughout.

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const SUBJECTS = [
  { icon: Calculator, label: "Math" },
  { icon: BookOpen, label: "Reading & Writing" },
  { icon: FlaskConical, label: "Science" },
  { icon: GraduationCap, label: "Test Prep" },
  { icon: Brain, label: "Study Skills" },
  { icon: Globe, label: "Foreign Language" },
];

const STEPS = [
  {
    number: "01",
    title: "Tell us about your student",
    description: "A quick conversation about goals, grade level, and what's not clicking yet.",
  },
  {
    number: "02",
    title: "Get matched with a tutor",
    description: "We pair your student with a tutor suited to their subject, pace, and personality.",
  },
  {
    number: "03",
    title: "Start learning, track progress",
    description: "Regular sessions, online or in person, with visibility into how things are going.",
  },
];

const VALUES = [
  {
    icon: Sparkles,
    title: "Personalized plans",
    description: "No fixed curriculum — every session is shaped around your student's actual needs.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted tutors",
    description: "Every tutor is screened for subject mastery and, just as important, for teaching ability.",
  },
  {
    icon: CalendarClock,
    title: "Flexible scheduling",
    description: "Sessions that fit around school, sports, and family life — not the other way around.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    description: "Clear, regular updates so you always know how your student is doing.",
  },
];

export function LandingPageV2() {
  return (
    <main className={`${display.variable} min-h-screen bg-[#FBF7F1] text-[#1B1B18] antialiased`}>
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          Borough Prep
        </span>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#1B1B18]/70 sm:flex">
          <a href="#subjects" className="transition-colors hover:text-[#1B1B18]">
            What we offer
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-[#1B1B18]">
            How it works
          </a>
          <a href="#why-us" className="transition-colors hover:text-[#1B1B18]">
            Why us
          </a>
        </nav>
        <a
          href="#contact"
          className="rounded-full bg-[#1B1B18] px-5 py-2.5 text-sm font-medium text-[#FBF7F1] transition-colors hover:bg-[#33322C]"
        >
          Get in Touch
        </a>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#E8A24A]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -left-32 h-80 w-80 rounded-full bg-[#7C6FE0]/20 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
          <div data-reveal>
            <span className="inline-flex items-center rounded-full bg-[#1B1B18]/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[#1B1B18]/70 uppercase">
              1:1 Online &amp; In-Person Tutoring
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Tutoring that actually{" "}
              <span className="italic text-[#7C6FE0]">clicks.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-[#1B1B18]/70 text-balance">
              Borough Prep matches your student with a tutor who gets them —
              building real understanding, not just better test scores.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1B1B18] px-6 py-3.5 text-sm font-medium text-[#FBF7F1] transition-colors hover:bg-[#33322C]"
              >
                Book a Free Consultation
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-[#1B1B18] underline decoration-[#1B1B18]/30 underline-offset-4 transition-colors hover:decoration-[#1B1B18]"
              >
                See how it works
              </a>
            </div>
          </div>

          <div data-reveal className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
            <div className="rounded-3xl border border-[#1B1B18]/10 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(27,27,24,0.25)]">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#7C6FE0]/15 text-[#7C6FE0]">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Algebra II · Session 6</p>
                  <p className="text-xs text-[#1B1B18]/50">with Ms. Patel</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {["Quadratic functions", "Factoring practice", "Word problems"].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2.5 rounded-xl bg-[#FBF7F1] px-3.5 py-2.5 text-sm text-[#1B1B18]/80"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[#E8A24A]" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[#1B1B18]/10 pt-4">
                <span className="text-xs text-[#1B1B18]/50">This week&apos;s focus</span>
                <span className="text-xs font-medium text-[#7C6FE0]">On track</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div data-reveal className="max-w-xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What we tutor
          </h2>
          <p className="mt-3 text-[#1B1B18]/60">
            Core subjects and exam prep, taught by tutors who specialize in them.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SUBJECTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              data-reveal
              className="flex flex-col gap-3 rounded-2xl border border-[#1B1B18]/10 bg-white p-6 transition-shadow hover:shadow-[0_12px_30px_-12px_rgba(27,27,24,0.15)]"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-[#E8A24A]/15 text-[#B9772E]">
                <Icon className="size-5" />
              </div>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#1B1B18] py-20 text-[#FBF7F1] sm:py-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div data-reveal className="max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-[#FBF7F1]/60">
              Three steps between where your student is now and where they&apos;re headed.
            </p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <div key={step.number} data-reveal>
                <span className="font-[family-name:var(--font-display)] text-4xl text-[#FBF7F1]/25">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-[#FBF7F1]/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why-us" className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div data-reveal className="max-w-xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Why families choose Borough Prep
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div key={title} data-reveal className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7C6FE0]/12 text-[#7C6FE0]">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-[#1B1B18]/60">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="px-6 pb-20 sm:px-10">
        <div
          data-reveal
          className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C6FE0] to-[#5C4FC0] px-8 py-16 text-center text-[#FBF7F1] sm:px-16 sm:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#E8A24A]/25 blur-3xl"
          />
          <h2 className="relative font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            Ready to see what clicks for your student?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[#FBF7F1]/80">
            Reach out and let&apos;s talk about what your student needs.
          </p>
          <a
            href="mailto:hello@boroughprep.com"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-[#FBF7F1] px-7 py-3.5 text-sm font-medium text-[#1B1B18] transition-colors hover:bg-white"
          >
            Get in Touch
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1B1B18]/10 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-[#1B1B18]/50 sm:flex-row">
          <span className="font-[family-name:var(--font-display)] text-[#1B1B18]/80">
            Borough Prep
          </span>
          <span>&copy; {new Date().getFullYear()} Borough Prep. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
