"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

/**
 * Cycles system → light → dark.
 *
 * One button rather than three, because it has to sit in the marketing header
 * as well as the app's, and neither has room for a segmented control. The
 * current mode is the icon; the label says what pressing it will do.
 *
 * Deliberately unstyled beyond its shape: it draws in currentColor and takes a
 * className, so the same component works on the app's token surface and inside
 * the /v3 paper-and-ink pages without either knowing about the other.
 */

const ORDER = ["system", "light", "dark"] as const;
type Mode = (typeof ORDER)[number];

const ICONS: Record<Mode, typeof Monitor> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Mode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/**
 * Whether hydration has finished.
 *
 * The store never emits, so this is `false` for the server render and the
 * hydrating render — where the markup must match what the server sent — and
 * `true` for every render after. useSyncExternalStore rather than a
 * setState-in-an-effect, which cascades a second render and is what the
 * react-hooks/set-state-in-effect rule exists to prevent.
 */
const NEVER_CHANGES = () => () => {};
const HYDRATED = () => true;
const NOT_YET = () => false;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // The active theme is only known on the client — it comes from localStorage
  // or the OS. Rendering the real icon before then would mean emitting one the
  // server had to guess, so an empty box of the same size holds the space until
  // the answer is in.
  const mounted = useSyncExternalStore(NEVER_CHANGES, HYDRATED, NOT_YET);

  const mode: Mode = ORDER.includes(theme as Mode) ? (theme as Mode) : "system";
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  const Icon = ICONS[mode];

  const shape = `inline-grid size-8 shrink-0 place-items-center rounded-full ${className}`;

  if (!mounted) return <span aria-hidden className={shape} />;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      // Both the state and the outcome: an icon-only control that says only
      // "Theme" leaves a screen reader user unable to tell which one is on.
      aria-label={`Theme: ${LABELS[mode]}. Switch to ${LABELS[next].toLowerCase()}.`}
      title={`Theme: ${LABELS[mode]}`}
      className={`${shape} transition-opacity hover:opacity-70`}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.6} />
    </button>
  );
}
