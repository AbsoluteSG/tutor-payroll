"use client";

import { useEffect, useState } from "react";

/**
 * Live telemetry strip. Everything starts as inert dashes and only becomes
 * live after mount — the clock would otherwise differ between the server
 * render and the client and trip a hydration mismatch.
 */
export function HudReadout() {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, "0");
      const mm = String(now.getUTCMinutes()).padStart(2, "0");
      const ss = String(now.getUTCSeconds()).padStart(2, "0");
      setClock(`${hh}:${mm}:${ss}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono text-[0.58rem] tracking-[0.2em] text-white/45 uppercase">
      <span>
        UTC <span className="text-white/80 tabular-nums">{clock ?? "--:--:--"}</span>
      </span>
      <span className="hidden sm:inline">CH — 001 / OPEN</span>
      <span className="hidden md:inline">LAT 40.6782 N — LON 73.9442 W</span>
      <span className="flex items-center gap-2">
        <span className="inline-block size-1 rounded-full bg-[#39FF9E]" />
        SIGNAL NOMINAL
      </span>
    </div>
  );
}
