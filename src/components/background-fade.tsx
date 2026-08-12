"use client";

import { usePathname } from "next/navigation";

// The fade overlay is tuned to the app's bg-background token, so it bands
// against standalone marketing pages that set their own background — skip it
// on those routes regardless of whether they're light or dark.
const LIGHT_THEMED_ROUTES = ["/v2", "/", "/v4"];

export function BackgroundFade() {
  const pathname = usePathname();
  // Prefix match so nested marketing routes (e.g. /courses) are covered too.
  const isMarketing = LIGHT_THEMED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isMarketing) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-16 bg-linear-to-t from-background to-transparent"
    />
  );
}
