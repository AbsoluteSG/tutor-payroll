"use client";

import { useCallback, useRef } from "react";

/**
 * Fires `onLongPress` after `ms` of a sustained press that hasn't moved more
 * than ~10px. Returns pointer handlers to spread onto the target element.
 */
export function useLongPress(onLongPress: () => void, ms = 3000) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        onLongPress();
        clear();
      }, ms);
    },
    [onLongPress, ms, clear],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      if (Math.abs(e.clientX - origin.current.x) > 10 || Math.abs(e.clientY - origin.current.y) > 10) {
        clear();
      }
    },
    [clear],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
