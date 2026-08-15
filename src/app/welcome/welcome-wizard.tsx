"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  saveOnboardingProfileAction,
  saveOnboardingAvailabilityAction,
} from "@/lib/actions/onboarding-actions";
import { startStripeOnboardingAction } from "@/lib/actions/stripe-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

/**
 * Three steps: who you are, when you teach, and — optionally — getting paid.
 *
 * Payouts is last and skippable because it is the only step that leaves the
 * site: Stripe's onboarding asks for a bank account and a tax ID, which a new
 * tutor may not have to hand, and blocking the whole flow on it would mean an
 * evening's delay turns into an unfinished profile. The first two steps are
 * what the booking system needs; the third is what payroll needs, and payroll
 * is not due on day one.
 */

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** A handful of US zones; the studio is in New York and tutors are US-based. */
const ZONES = [
  ["America/New_York", "Eastern (New York)"],
  ["America/Chicago", "Central (Chicago)"],
  ["America/Denver", "Mountain (Denver)"],
  ["America/Phoenix", "Arizona (no DST)"],
  ["America/Los_Angeles", "Pacific (Los Angeles)"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
];

function toTimeInput(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

type Rule = { weekday: number; startMinute: number; endMinute: number };

export function WelcomeWizard({
  name,
  done,
  published,
  stripeConfigured,
  stripeConnected,
  stripeStarted,
  profile,
  availability,
}: {
  name: string;
  done: boolean;
  published: boolean;
  stripeConfigured: boolean;
  stripeConnected: boolean;
  stripeStarted: boolean;
  profile: {
    timeZone: string;
    phone: string;
    headline: string;
    bio: string;
    subjects: string;
  };
  availability: Rule[];
}) {
  // A tutor who has already finished opens on the last step rather than being
  // walked through a form they have filled in.
  const [step, setStep] = useState(done ? 3 : 1);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">
          {done ? `You're all set, ${name.split(" ")[0]}` : `Welcome, ${name.split(" ")[0]}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {done
            ? published
              ? "Your profile is live on the site."
              : "Your details are with the studio. They'll publish your profile once your rate is set."
            : "A couple of details and you'll be ready to take bookings."}
        </p>
      </div>

      <Steps step={step} done={done} />

      {step === 1 && (
        <ProfileStep
          profile={profile}
          onDone={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <AvailabilityStep
          availability={availability}
          onBack={() => setStep(1)}
          onDone={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <PayoutsStep
          configured={stripeConfigured}
          connected={stripeConnected}
          started={stripeStarted}
          published={published}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

function Steps({ step, done }: { step: number; done: boolean }) {
  const labels = ["About you", "Your hours", "Getting paid"];
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const complete = done ? n <= 2 : n < step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                n === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : complete
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground"
              }`}
            >
              {complete ? "✓" : n}
            </span>
            <span
              className={`hidden text-sm sm:inline ${
                n === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span aria-hidden className="h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ProfileStep({
  profile,
  onDone,
}: {
  profile: {
    timeZone: string;
    phone: string;
    headline: string;
    bio: string;
    subjects: string;
  };
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveOnboardingProfileAction,
    undefined
  );
  // The action returns undefined on success, so a completed submit with no
  // error is the signal to advance.
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (submitted && !pending && !state?.error) onDone();
  }, [submitted, pending, state, onDone]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About you</CardTitle>
        <CardDescription>
          The headline and profile appear on your page once the studio
          publishes you. Your phone number never does.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          onSubmit={() => setSubmitted(true)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="timeZone">Your time zone</Label>
            <select
              id="timeZone"
              name="timeZone"
              defaultValue={profile.timeZone}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {ZONES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              The hours you set next are in this zone, so a 4pm slot is your
              4pm wherever the family is.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={profile.phone}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="headline">What do you teach?</Label>
            <Input
              id="headline"
              name="headline"
              maxLength={120}
              required
              defaultValue={profile.headline}
              placeholder="Algebra through calculus"
            />
            <p className="text-xs text-muted-foreground">
              One line. What a parent should come to you for.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subjects">Subjects (optional)</Label>
            <Input
              id="subjects"
              name="subjects"
              defaultValue={profile.subjects}
              placeholder="Algebra I, Geometry, SAT Math"
            />
            <p className="text-xs text-muted-foreground">Separated by commas.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">A short profile</Label>
            <textarea
              id="bio"
              name="bio"
              required
              rows={5}
              maxLength={1500}
              defaultValue={profile.bio}
              placeholder="How you teach, what you studied, anything a parent would want to know."
              className="rounded-md border bg-transparent p-3 text-sm"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending && <Spinner />}
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AvailabilityStep({
  availability,
  onBack,
  onDone,
}: {
  availability: Rule[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveOnboardingAvailabilityAction,
    undefined
  );
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (submitted && !pending && !state?.error) onDone();
  }, [submitted, pending, state, onDone]);

  // One row per weekday, pre-filled from anything already saved.
  const existing = new Map<number, Rule>();
  for (const r of availability) if (!existing.has(r.weekday)) existing.set(r.weekday, r);
  const [enabled, setEnabled] = useState<boolean[]>(
    WEEKDAYS.map((_, i) => existing.has(i))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">When can you teach?</CardTitle>
        <CardDescription>
          Roughly is fine — you can change it any time, and block off single
          days later. Families are only ever offered times inside these hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          onSubmit={() => setSubmitted(true)}
          className="grid gap-3"
        >
          {WEEKDAYS.map((label, i) => {
            const rule = existing.get(i);
            return (
              <div key={label} className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabled[i]}
                    onChange={(e) =>
                      setEnabled((prev) =>
                        prev.map((v, j) => (j === i ? e.target.checked : v))
                      )
                    }
                    className="size-4"
                  />
                  {label}
                </label>
                {/* Disabled inputs are not submitted, which is exactly how an
                    unticked day disappears from the posted week. */}
                <Input
                  type="time"
                  name={`d${i}_start_0`}
                  disabled={!enabled[i]}
                  defaultValue={rule ? toTimeInput(rule.startMinute) : "16:00"}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  name={`d${i}_end_0`}
                  disabled={!enabled[i]}
                  defaultValue={rule ? toTimeInput(rule.endMinute) : "20:00"}
                  className="w-32"
                />
              </div>
            );
          })}

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {pending ? "Saving…" : "Save and continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PayoutsStep({
  configured,
  connected,
  started,
  published,
  onBack,
}: {
  configured: boolean;
  connected: boolean;
  started: boolean;
  published: boolean;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Getting paid</CardTitle>
        <CardDescription>
          Optional for now. You can teach and log classes without this — it is
          only needed before the studio can pay you out.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {connected ? (
          <p className="text-sm">
            Your payout account is connected. Nothing else to do.
          </p>
        ) : !configured ? (
          <p className="text-sm text-muted-foreground">
            Payouts aren&apos;t switched on yet. The studio will be in touch
            when they are.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Stripe will ask for your bank details and tax information. It
              takes a few minutes, and you can come back to it whenever you
              have them to hand.
            </p>
            <form action={startStripeOnboardingAction}>
              <Button type="submit">
                {started ? "Finish setting up payouts" : "Set up payouts"}
              </Button>
            </form>
          </>
        )}

        <div className="border-t pt-4">
          <p className="text-sm font-medium">
            {published
              ? "You're live on the site."
              : "What happens next"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {published
              ? "Families can find you and book you."
              : "The studio sets your rate and publishes your profile. You'll start appearing on the site and taking bookings once they do."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant={connected ? "default" : "secondary"}>
              {connected ? "Go to my dashboard" : "I'll do this later"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
