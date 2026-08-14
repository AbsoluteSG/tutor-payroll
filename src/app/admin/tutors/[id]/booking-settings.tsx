"use client";

import { useState } from "react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { updateTutorBookingSettingsAction } from "@/lib/actions/tutor-booking-actions";
import { TIERS } from "@/components/marketing/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Makes a tutor bookable on the public site.
 *
 * The margin is shown live rather than left to be worked out on paper: these
 * are two different numbers that are easy to confuse, and setting the tutor's
 * pay above the tier price is a mistake worth catching before a parent pays.
 */

/**
 * The zones tutors are actually in, not all 400 IANA names. Add to this list
 * when someone joins from somewhere new — a dropdown of every zone on earth is
 * a worse way to pick "Eastern".
 */
const ZONES = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

export type BookingSettings = {
  id: string;
  slug: string;
  tier: string;
  defaultTutorRate: string;
  timeZone: string;
  bookable: boolean;
};

export function TutorBookingSettings({ settings }: { settings: BookingSettings }) {
  const [tier, setTier] = useState(settings.tier);
  const [rate, setRate] = useState(settings.defaultTutorRate);

  const save = useActionFeedback(
    (fd) => updateTutorBookingSettingsAction(undefined, fd),
    { success: "Booking settings saved" }
  );

  const tierRate = TIERS.find((t) => t.id === tier.toLowerCase())?.rate ?? null;
  const payRate = parseFloat(rate);
  const margin =
    tierRate != null && Number.isFinite(payRate) ? tierRate - payRate : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Public booking</CardTitle>
        <CardDescription>
          A tutor appears on the website only with a slug, a tier and a pay rate
          set — without all three a parent could pay for a class this tutor
          can&apos;t log.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={save.formAction} className="grid gap-4">
          <input type="hidden" name="id" value={settings.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="slug">Website slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={settings.slug}
                placeholder="samantha-yershov"
              />
              <p className="text-xs text-muted-foreground">
                Must match their entry in the marketing roster.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeZone">Time zone</Label>
              <select
                id="timeZone"
                name="timeZone"
                defaultValue={settings.timeZone}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                The zone their availability is written in.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tier">Tier — what the client pays</Label>
              <select
                id="tier"
                name="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Not set</option>
                {TIERS.map((t) => (
                  <option key={t.id} value={t.id.toUpperCase()}>
                    {t.name} — ${t.rate}/hr
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultTutorRate">Pay rate — what they earn</Label>
              <Input
                id="defaultTutorRate"
                name="defaultTutorRate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 60"
              />
            </div>
          </div>

          {/* The two numbers side by side. They are easy to confuse and the
              consequence of confusing them is selling at a loss. */}
          {tierRate != null && (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              Client pays{" "}
              <span className="font-medium tabular-nums">${tierRate}/hr</span>
              {Number.isFinite(payRate) ? (
                <>
                  {" · tutor earns "}
                  <span className="font-medium tabular-nums">${payRate}/hr</span>
                  {" · margin "}
                  <span
                    className={`font-medium tabular-nums ${
                      margin != null && margin <= 0 ? "text-red-400" : ""
                    }`}
                  >
                    ${margin?.toFixed(2)}/hr
                  </span>
                  {margin != null && margin <= 0 && " — you lose money on this"}
                </>
              ) : (
                " · set a pay rate to see the margin"
              )}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="bookable"
              defaultChecked={settings.bookable}
              className="size-4"
            />
            Show on the website and accept bookings
          </label>

          {save.error && <p className="text-sm text-red-400">{save.error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={save.pending}>
              {save.pending && <Spinner />}
              {save.pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
