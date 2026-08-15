"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * The calendar: a month grid, a single-day drill-down, and a detail panel.
 *
 * ─── Why three views and not one ────────────────────────────────────────────
 * At real volume — six tutors, 150-odd classes a month — the month grid alone
 * is unreadable: a day with eight classes is eight lines of 11px text, and the
 * row it sits in stretches until the grid stops looking like a month. So the
 * month view deliberately shows only the first few per day and says how many
 * more there are, keeping every cell the same height and the shape of the month
 * legible. Reading a particular day is the day view's job, and reading a
 * particular class is the panel's.
 *
 * ─── Dates ──────────────────────────────────────────────────────────────────
 * All arithmetic is on the `day` key (YYYY-MM-DD, computed server-side in the
 * business zone), never on Date objects in the browser. The viewer's machine
 * may be in any zone, and `new Date(iso).getDate()` would put a 9pm class on
 * the following day for anyone west of the studio.
 */

export type CalendarEntry = {
  id: string;
  /** YYYY-MM-DD in the business zone. */
  day: string;
  /** Minutes from local midnight; sorts the day and positions the row. */
  startMinutes: number;
  time: string;
  endTime: string;
  tutorName: string;
  clientId: string;
  clientLabel: string;
  studentName: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  /** Present when this class came out of a public booking. */
  booking: {
    id: string;
    subject: string;
    track: string;
    paid: string | null;
    parentName: string;
    parentEmail: string;
  } | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Entries shown in a month cell before it collapses into a count. */
const PREVIEW = 3;

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

function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Colour by provenance, dimmed when the class is off. */
function entryTone(e: CalendarEntry) {
  if (e.status === "CANCELED") {
    return "bg-muted text-muted-foreground line-through";
  }
  return e.booking
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    : "bg-green-500/10 text-green-600 dark:text-green-400";
}

export function CalendarGrid({
  entries,
  initialMonth,
  today,
}: {
  entries: CalendarEntry[];
  initialMonth: string;
  today: string;
}) {
  const [ym, setYm] = useState(initialMonth);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const [year, month] = ym.split("-").map(Number);

  // Escape backs out one layer at a time — panel first, then the day.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else if (openDay) setOpenDay(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, openDay]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const list = map.get(e.day);
      if (list) list.push(e);
      else map.set(e.day, [e]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startMinutes - b.startMinutes);
    }
    return map;
  }, [entries]);

  const shift = (delta: number) => {
    const m = month + delta;
    const y = year + Math.floor((m - 1) / 12);
    const mm = ((((m - 1) % 12) + 12) % 12) + 1;
    setYm(`${y}-${String(mm).padStart(2, "0")}`);
    setOpenDay(null);
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
  const dayEntries = openDay ? (byDay.get(openDay) ?? []) : [];

  return (
    <div className="grid gap-3">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {openDay ? dayLabel(openDay) : monthLabel(year, month)}
          </p>
          <p className="text-xs text-muted-foreground">
            {openDay
              ? dayEntries.length === 0
                ? "Nothing scheduled."
                : `${dayEntries.length} ${dayEntries.length === 1 ? "class" : "classes"}, ${new Set(dayEntries.map((e) => e.tutorName)).size} ${new Set(dayEntries.map((e) => e.tutorName)).size === 1 ? "tutor" : "tutors"}.`
              : monthCount === 0
                ? "Nothing scheduled this month."
                : `${monthCount} ${monthCount === 1 ? "class" : "classes"}, all tutors. Click a day to open it.`}
          </p>
        </div>
        <div className="flex gap-1.5">
          {openDay ? (
            <Button variant="outline" size="sm" onClick={() => setOpenDay(null)}>
              ← Back to month
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => shift(-1)}>
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setYm(initialMonth);
                  setOpenDay(null);
                }}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => shift(1)}>
                Next →
              </Button>
            </>
          )}
        </div>
      </div>

      {openDay ? (
        <DayView
          entries={dayEntries}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      ) : (
        /* ── Month grid ──
           Scrolls rather than squashing: seven columns of readable names do
           not fit a phone, and a calendar with the names cut off is a grid of
           coloured dots. */
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
                    <div
                      key={`pad-${i}`}
                      className="h-32 border-r border-b bg-muted/20"
                    />
                  );
                }
                const list = byDay.get(day) ?? [];
                const isToday = day === today;
                const hidden = list.length - PREVIEW;

                return (
                  // A fixed height is what keeps the month a month: let the
                  // cell grow with its contents and one busy Tuesday stretches
                  // its whole week.
                  <button
                    key={day}
                    type="button"
                    onClick={() => setOpenDay(day)}
                    className={`h-32 overflow-hidden border-r border-b p-1.5 text-left transition-colors hover:bg-muted/40 ${
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
                        {Number(day.slice(-2))}
                      </span>
                      {list.length > 0 && (
                        <span className="text-[0.65rem] text-muted-foreground">
                          {list.length}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-1">
                      {list.slice(0, PREVIEW).map((e) => (
                        <div
                          key={e.id}
                          className={`truncate rounded px-1.5 py-1 text-[0.7rem] leading-tight ${entryTone(e)}`}
                        >
                          <span className="font-medium">{e.time}</span>{" "}
                          <span className="opacity-80">{e.studentName}</span>
                        </div>
                      ))}
                      {hidden > 0 && (
                        <span className="px-1.5 text-[0.68rem] text-muted-foreground">
                          + {hidden} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      <DetailPanel entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/**
 * One day, every tutor, in time order.
 *
 * A plain ordered list rather than a scaled time axis: the studio teaches in a
 * five-hour window, so a true axis would be four-fifths empty, and what a
 * manager reads off this is sequence and clashes rather than duration.
 */
function DayView({
  entries,
  selectedId,
  onSelect,
}: {
  entries: CalendarEntry[];
  selectedId: string | null;
  onSelect: (e: CalendarEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
        Nothing scheduled on this day.
      </div>
    );
  }

  return (
    <ul className="grid gap-1.5">
      {entries.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onSelect(e)}
            aria-pressed={selectedId === e.id}
            className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
              selectedId === e.id ? "border-primary bg-muted/40" : ""
            }`}
          >
            <span className="w-32 shrink-0 font-medium tabular-nums">
              {e.time}
              <span className="text-muted-foreground"> – {e.endTime}</span>
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block font-medium ${
                  e.status === "CANCELED" ? "text-muted-foreground line-through" : ""
                }`}
              >
                {e.studentName}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {e.clientLabel}
                </span>
              </span>
              <span className="block text-sm text-muted-foreground">
                {e.tutorName} · {e.durationMinutes}m
                {e.booking ? ` · ${e.booking.subject}` : ""}
              </span>
            </span>

            <Badge
              className={
                e.status === "CANCELED"
                  ? "bg-muted text-muted-foreground"
                  : e.booking
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-green-500/10 text-green-500"
              }
            >
              {e.status === "CANCELED"
                ? "Cancelled"
                : e.booking
                  ? "Booked online"
                  : "Scheduled"}
            </Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Everything known about one class, sliding in from the right. */
function DetailPanel({
  entry,
  onClose,
}: {
  entry: CalendarEntry | null;
  onClose: () => void;
}) {
  // Kept mounted and translated off-screen so the slide runs both ways; a
  // conditionally rendered panel would pop out of existence on close.
  const open = Boolean(entry);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Class details"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l bg-background shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {entry && (
          <div className="grid gap-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {dayLabel(entry.day)}
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {entry.time} – {entry.endTime}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge
                className={
                  entry.booking
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-green-500/10 text-green-500"
                }
              >
                {entry.booking ? "Booked online" : "Scheduled by you"}
              </Badge>
              <Badge
                className={
                  entry.status === "CANCELED"
                    ? "bg-red-500/10 text-red-500"
                    : entry.status === "COMPLETED"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-muted text-muted-foreground"
                }
              >
                {entry.status.charAt(0) + entry.status.slice(1).toLowerCase()}
              </Badge>
            </div>

            <Field label="Student">{entry.studentName}</Field>
            <Field label="Tutor">{entry.tutorName}</Field>
            <Field label="Client">
              <Link
                href={`/admin/clients/${entry.clientId}`}
                className="underline underline-offset-4"
              >
                {entry.clientLabel}
              </Link>
            </Field>
            <Field label="Length">{entry.durationMinutes} minutes</Field>

            {entry.booking && (
              <>
                <div className="border-t pt-4">
                  <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    From a website booking
                  </p>
                  <div className="grid gap-4">
                    <Field label="Course">
                      {entry.booking.subject} — {entry.booking.track}
                    </Field>
                    <Field label="Booked by">
                      {entry.booking.parentName}
                      <span className="block text-sm text-muted-foreground">
                        {entry.booking.parentEmail}
                      </span>
                    </Field>
                    {entry.booking.paid && (
                      <Field label="Paid">{entry.booking.paid}</Field>
                    )}
                  </div>
                </div>
                <Link
                  href="/admin/bookings"
                  className="text-sm underline underline-offset-4"
                >
                  All bookings →
                </Link>
              </>
            )}

            {entry.notes && (
              <div className="border-t pt-4">
                <Field label="Notes">{entry.notes}</Field>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
