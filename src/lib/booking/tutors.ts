import { prisma } from "@/lib/prisma";
import { TIER_BY_ID, type TierId } from "@/components/marketing/pricing";

/**
 * Who can actually be booked, and for how much.
 *
 * ─── The gate ───────────────────────────────────────────────────────────────
 * A tutor is offered to the public only when every input a completed booking
 * will need already exists. The reason is specific rather than defensive:
 * `submitClassAction` reads `tutorRate` from the `RateCard` and refuses without
 * one, so a booking that cannot provision a rate card produces a class the
 * tutor is unable to log — after the parent has paid. Checking at LISTING time
 * means that state is unreachable; checking at payment time would mean taking
 * money first and discovering it second.
 *
 * ─── What must never leave here ─────────────────────────────────────────────
 * `defaultTutorRate` is what the tutor earns. It is deliberately absent from
 * the returned shape, because these values are passed into public page props
 * and anything on them is one `view-source` away from the parent. Only the
 * tier's published rate — what the client pays — is public.
 */

export type BookableTutor = {
  userId: string;
  slug: string;
  name: string;
  tier: TierId;
  /** Published hourly rate the CLIENT pays, in whole dollars. */
  hourlyRate: number;
  /** IANA zone the tutor's availability is expressed in. */
  timeZone: string;
};

const TIER_ID: Record<string, TierId> = {
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
};

/**
 * The whole gate as a Prisma filter. Every one of these is load-bearing:
 * no slug means nothing on the marketing site can point at them; no tier means
 * no price to charge; no defaultTutorRate means no rate card at commit time.
 */
const BOOKABLE = {
  role: "TUTOR",
  active: true,
  bookable: true,
  slug: { not: null },
  tier: { not: null },
  defaultTutorRate: { not: null },
} as const;

const SELECT = {
  id: true,
  slug: true,
  name: true,
  tier: true,
  timeZone: true,
} as const;

type Row = {
  id: string;
  slug: string | null;
  name: string;
  tier: string | null;
  timeZone: string;
};

/**
 * Prisma's `Decimal` is not serializable across the RSC boundary, so nothing
 * here returns one — and `hourlyRate` comes from the published tier table
 * rather than the database, keeping the public number and the payroll number
 * in separate places on purpose.
 */
function toBookable(row: Row): BookableTutor | null {
  if (!row.slug || !row.tier) return null;
  const tier = TIER_ID[row.tier];
  if (!tier) return null;
  return {
    userId: row.id,
    slug: row.slug,
    name: row.name,
    tier,
    hourlyRate: TIER_BY_ID[tier].rate,
    timeZone: row.timeZone,
  };
}

/**
 * Everyone bookable, for the public site.
 *
 * Swallows database failures and returns an empty list. The marketing site is
 * mostly static and must not 500 because Postgres hiccuped — the visible cost
 * of a failure here is that booking is unavailable for a few minutes, which is
 * far cheaper than the page not rendering at all.
 */
export async function bookableTutors(): Promise<BookableTutor[]> {
  try {
    const rows = await prisma.user.findMany({
      where: BOOKABLE,
      select: SELECT,
      orderBy: { name: "asc" },
    });
    return rows.map(toBookable).filter((t): t is BookableTutor => t !== null);
  } catch (error) {
    console.error("[booking] could not load bookable tutors", error);
    return [];
  }
}

/**
 * One tutor by slug, for the checkout endpoint.
 *
 * Deliberately does NOT swallow errors the way `bookableTutors` does: this is
 * the read that stands between a stranger and a payment, and a database blip
 * must fail the booking rather than silently look like "no such tutor".
 */
export async function bookableTutorBySlug(
  slug: string
): Promise<BookableTutor | null> {
  const row = await prisma.user.findFirst({
    where: { ...BOOKABLE, slug },
    select: SELECT,
  });
  return row ? toBookable(row) : null;
}

/**
 * The tutor's own pay rate, for the commit path only.
 *
 * Separate from `bookableTutorBySlug` so that the rate is fetched explicitly by
 * the one server-side caller that needs it, and can never ride along into a
 * page's props by accident.
 */
export async function tutorPayRate(userId: string) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultTutorRate: true },
  });
  return row?.defaultTutorRate ?? null;
}

/**
 * Tutor-written profile copy for the public directory.
 *
 * Gated on `bookable` — the same switch that gates everything else public. A
 * tutor who has finished onboarding but has not been published has written
 * their profile into a draft, and it stays in the admin until a manager decides
 * otherwise. Without that gate, filling in the welcome form would publish
 * yourself, which is exactly what the manager approval step exists to prevent.
 *
 * Returns an empty list on a database failure, like `bookableTutors` above and
 * for the same reason: the directory is mostly static copy and must not 500
 * because Postgres hiccuped. The visible cost is that the roster's own words
 * are shown instead.
 */
export async function publishedTutorProfiles(): Promise<
  { slug: string; headline: string | null; bio: string | null; subjects: string[] }[]
> {
  try {
    const rows = await prisma.user.findMany({
      where: { ...BOOKABLE },
      select: { slug: true, headline: true, bio: true, subjects: true },
    });
    return rows
      .filter((r): r is typeof r & { slug: string } => Boolean(r.slug))
      .map((r) => ({
        slug: r.slug,
        headline: r.headline,
        bio: r.bio,
        subjects: r.subjects,
      }));
  } catch (error) {
    console.error("[tutors] could not load published profiles", error);
    return [];
  }
}
