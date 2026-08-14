"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useActionFeedback } from "@/lib/use-action-feedback";
import {
  saveAvailabilityAction,
  setTimeZoneAction,
} from "@/lib/actions/availability-actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * The weekly pattern, as seven rows of time ranges.
 *
 * Deliberately not a calendar. A tutor's availability is a habit — "Tuesdays
 * and Thursdays after school" — and a grid of 336 half-hour checkboxes is a
 * worse way to say that than seven rows with a start and an end.
 */

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Same curated list as the admin side — not all 400 IANA zones. */
const ZONES = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

export type WeekRanges = Record<number, { start: string; end: string }[]>;

export function AvailabilityForm({
  initial,
  timeZone,
}: {
  initial: WeekRanges;
  timeZone: string;
}) {
  const [week, setWeek] = useState<WeekRanges>(initial);

  const save = useActionFeedback((fd) => saveAvailabilityAction(undefined, fd), {
    success: "Availability saved",
  });
  const zone = useActionFeedback((fd) => setTimeZoneAction(undefined, fd), {
    success: "Time zone updated",
  });

  const addRange = (weekday: number) =>
    setWeek((w) => ({
      ...w,
      [weekday]: [...(w[weekday] ?? []), { start: "16:00", end: "18:00" }],
    }));

  const removeRange = (weekday: number, index: number) =>
    setWeek((w) => ({
      ...w,
      [weekday]: (w[weekday] ?? []).filter((_, i) => i !== index),
    }));

  const setRange = (
    weekday: number,
    index: number,
    key: "start" | "end",
    value: string
  ) =>
    setWeek((w) => ({
      ...w,
      [weekday]: (w[weekday] ?? []).map((r, i) =>
        i === index ? { ...r, [key]: value } : r
      ),
    }));

  const total = Object.values(week).reduce((n, r) => n + r.length, 0);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your time zone</CardTitle>
          <CardDescription>
            The times below are written in this zone. Families see them
            converted to their own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={zone.formAction} className="flex flex-wrap items-end gap-2">
            <select
              name="timeZone"
              defaultValue={timeZone}
              className="h-9 min-w-56 rounded-md border bg-transparent px-3 text-sm"
              aria-label="Time zone"
            >
              {ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" disabled={zone.pending}>
              {zone.pending && <Spinner />}
              Update
            </Button>
            {zone.error && <p className="text-sm text-red-400">{zone.error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly availability</CardTitle>
          <CardDescription>
            When you&apos;re willing to teach, week after week. Families can only
            book inside these windows, and a class already on your schedule
            blocks its own time automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={save.formAction} className="grid gap-4">
            {DAYS.map((label, weekday) => {
              const ranges = week[weekday] ?? [];
              return (
                <div
                  key={label}
                  className="grid gap-2 border-b pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[7rem_1fr]"
                >
                  <span className="pt-2 text-sm font-medium">{label}</span>

                  <div className="grid gap-2">
                    {ranges.length === 0 && (
                      <span className="py-2 text-sm text-muted-foreground">
                        Not available
                      </span>
                    )}

                    {ranges.map((range, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          name={`start-${weekday}`}
                          value={range.start}
                          step={900}
                          onChange={(e) =>
                            setRange(weekday, index, "start", e.target.value)
                          }
                          aria-label={`${label} start`}
                          className="h-9 rounded-md border bg-transparent px-2 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          type="time"
                          name={`end-${weekday}`}
                          value={range.end}
                          step={900}
                          onChange={(e) =>
                            setRange(weekday, index, "end", e.target.value)
                          }
                          aria-label={`${label} end`}
                          className="h-9 rounded-md border bg-transparent px-2 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${label} window`}
                          onClick={() => removeRange(weekday, index)}
                        >
                          <X />
                        </Button>
                      </div>
                    ))}

                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addRange(weekday)}
                      >
                        <Plus /> Add window
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {save.error && <p className="text-sm text-red-400">{save.error}</p>}

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {total === 0
                  ? "No availability set — you won't appear as bookable."
                  : `${total} ${total === 1 ? "window" : "windows"} a week`}
              </span>
              <Button type="submit" disabled={save.pending}>
                {save.pending && <Spinner />}
                {save.pending ? "Saving…" : "Save availability"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
