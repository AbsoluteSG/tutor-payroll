import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

// Placeholder copy — swap in real business details, photos, and a working
// contact destination once the client has them ready.
const SUBJECTS = [
  {
    title: "Math",
    description: "From foundational skills to advanced coursework, built around how your student learns best.",
  },
  {
    title: "Reading & Writing",
    description: "Comprehension, essay structure, and confidence putting ideas on the page.",
  },
  {
    title: "Test Prep",
    description: "Focused, goal-oriented prep for the exams that matter most this year.",
  },
  {
    title: "Study Skills",
    description: "Organization, time management, and habits that carry over to every subject.",
  },
];

const FEATURES = [
  {
    title: "Personalized approach",
    description: "Every plan is built around your student's goals, pace, and learning style — not a fixed curriculum.",
  },
  {
    title: "Experienced tutors",
    description: "Sessions led by tutors who know their subjects and know how to teach them.",
  },
  {
    title: "Flexible scheduling",
    description: "Sessions that fit around school, activities, and family schedules.",
  },
];

export function LandingPage() {
  return (
    <main className="flex-1">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-heading text-lg font-semibold tracking-tight">
          Borough Prep
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-muted-foreground hover:bg-accent" />
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
        <h1
          data-reveal
          className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Personalized tutoring, tailored to your student
        </h1>
        <p
          data-reveal
          className="max-w-xl text-balance text-lg text-muted-foreground"
        >
          Borough Prep pairs students with experienced tutors for one-on-one
          support in math, reading, writing, and test prep — built around
          your student&apos;s goals.
        </p>
        <div data-reveal className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button size="lg">Get in Touch</Button>
          <a
            href="#subjects"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            See what we offer
          </a>
        </div>
      </section>

      <section id="subjects" className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 data-reveal className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What we tutor
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <Card key={subject.title} data-reveal>
              <CardHeader>
                <CardTitle>{subject.title}</CardTitle>
                <CardDescription>{subject.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 data-reveal className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why Borough Prep
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} data-reveal>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 py-20 text-center sm:py-24">
        <h2 data-reveal className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to get started?
        </h2>
        <p data-reveal className="max-w-md text-balance text-muted-foreground">
          Reach out and let&apos;s talk about what your student needs.
        </p>
        <Button data-reveal size="lg">
          Get in Touch
        </Button>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>Borough Prep &middot; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
