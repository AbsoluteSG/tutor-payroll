"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Reads the user's motion preference as an external store rather than syncing it
 * into state via an effect — it stays live if the setting changes mid-visit, and
 * avoids the cascading render that a setState-in-effect would cause.
 *
 * Returns false during server rendering, so markup is generated as though motion
 * is allowed and then corrected on hydration.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
