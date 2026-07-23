"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Dims + pulses the tab label while its route segment is loading. */
function TabLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={pending ? "animate-pulse opacity-60" : undefined}>{children}</span>;
}

export function NavTabs({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto">
      {links.map((l) => {
        // Exact match, or a sub-path (e.g. /admin/tutors/[id] highlights Tutors).
        // Longest matching href wins so /admin doesn't stay lit on /admin/tutors.
        const active =
          pathname === l.href ||
          (pathname.startsWith(`${l.href}/`) &&
            !links.some((o) => o.href.length > l.href.length && pathname.startsWith(o.href)));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 pt-3 pb-2.5 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <TabLabel>{l.label}</TabLabel>
          </Link>
        );
      })}
    </nav>
  );
}
