"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * An unfiltered month calendar: every tutor, every client, one grid.
 *
 * The schedule page answers "what is next" as a list. This answers "what does
 * the week actually look like", which a list cannot — a Tuesday with six
 * classes and a Wednesday with none are adjacent rows there and obvious here.
 *
 * All arithmetic is done on the pre-formatted `day` key (YYYY-MM-DD, computed
 * server-side in the business zone) rather than on Date objects in the browser.
 * The viewer's machine may be in any zone, and `new Date(iso).getDate()` would
 * put a 9pm class on the following day for anyone west of the studio.
 */

export type CalendarEntry = {
  id: string;
  /** YYYY-MM-DD in the business zone. */
  day: string;
  /** Pre-formatted clock time in the business zone, e.g. "4:00 PM". */
  time: string;
  tutorName: string;
  clientLabel: string;
  studentName: string;
  durationMinutes: number;
  status: string;
  /** Came from a public booking rather than being scheduled by hand. */
  fromBooking: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parses YYYY-MM-DD into its parts without going near a Date. */
function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday index (0=Sun) of the 1st, via UTC so no local zone is involved. */
function firstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CalendarGrid({
  entries,
  initialMonth,
  today,
}: {
  entries: CalendarEntry[];
  /** YYYY-MM of the month to open on. */
  initialMonth: string;
  /** YYYY-MM-DD in the business zone, for the "today" ring. */
  today: string;
}) {
  const [ym, setYm] = useState(initialMonth);
  const [year, month] = ym.split("-").map(Number);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const list = map.get(e.day);
      if (list) list.push(e);
      else map.set(e.day, [e]);
    }
    return map;
  }, [entries]);

  const shift = (delta: number) => {
    const m = month + delta;
    const y = year + Math.floor((m - 1) / 12);
    const mm = ((((m - 1) % 12) + 12) % 12) + 1;
    setYm(`${y}-${String(mm).padStart(2, "0")}`);
  };

  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from(
      { length: total },
      (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthCount = entries.filter((e) => e.day.startsWith(ym)).length;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{monthLabel(year, month)}</p>
          <p className="text-xs text-muted-foreground">
            {monthCount === 0
              ? "Nothing scheduled this month."
              : `${monthCount} ${monthCount === 1 ? "class" : "classes"}, all tutors.`}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => shift(-1)}>
            ← Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setYm(initialMonth)}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => shift(1)}>
            Next →
          </Button>
        </div>
      </div>

      {/* Scrolls rather than squashing: seven columns of readable class names
          do not fit a phone, and a calendar with the names cut off is a grid of
          coloured dots. */}
      <div className="overflow-x-auto">
        <div className="min-w-[46rem]">
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-muted/40 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px border-l border-t">
            {cells.map((day, i) => {
              if (!day) {
                return (
                  <div key={`pad-${i}`} className="min-h-24 border-r border-b bg-muted/20" />
                );
              }
              const list = byDay.get(day) ?? [];
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`min-h-24 border-r border-b p-1.5 ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isToday
                          ? "rounded bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {parseDay(day).d}
                    </span>
                    {list.length > 2 && (
                      <span className="text-[0.65rem] text-muted-foreground">
                        {list.length}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1">
                    {list.map((e) => (
                      <div
                        key={e.id}
                        title={`${e.time} · ${e.studentName} with ${e.tutorName} · ${e.clientLabel} · ${e.durationMinutes}m${e.fromBooking ? " · booked online" : ""}`}
                        className={`rounded px-1.5 py-1 text-[0.7rem] leading-tight ${
                          e.status === "CANCELED"
                            ? "bg-muted text-muted-foreground line-through"
                            : e.fromBooking
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                        }`}
                      >
                        <span className="font-medium">{e.time}</span>{" "}
                        <span className="opacity-80">{e.studentName}</span>
                        <span className="block truncate opacity-60">
                          {e.tutorName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-blue-500/40" /> Booked online
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-green-500/40" /> Scheduled by you
        </span>
        <Link href="/admin/schedule" className="underline underline-offset-4">
          List view →
        </Link>
      </div>
    </div>
  );
}
