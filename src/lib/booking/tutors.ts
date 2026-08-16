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

/** Everything the public directory and the subject pages render for one tutor. */
export type PublicTutor = {
  slug: string;
  name: string;
  /** Derived rather than stored — one less thing to keep in step with the name. */
  initials: string;
  headline: string;
  bio: string[];
  subjects: string[];
  education: string[];
  specialties: string[];
  testPrep: string[];
  levels: string | null;
  /** Whole years teaching, or null where they have not said. */
  years: number | null;
  photo: string | null;
  photoAlt: string | null;
  courses: string[];
  /** Whether this tutor can actually be booked online right now. */
  bookable: boolean;
};

/** "Samantha Yershov" -> "SY", "Jared" -> "J". */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The tutors the public site may show.
 *
 * Gated on the same `bookable` switch as everything else public, so an
 * unpublished profile — a tutor midway through onboarding, or one whose rate a
 * manager has not set — is not on the site. This is the ONLY source of tutors
 * for the directory and the subject pages; there is deliberately no hand-written
 * fallback list, because a fallback is what previously kept six people on the
 * site after the database was emptied.
 *
 * `course` filters to a subject page's own tutors.
 */
export async function publicTutors(course?: string): Promise<PublicTutor[]> {
  try {
    const rows = await prisma.user.findMany({
      where: {
        ...BOOKABLE,
        ...(course ? { courses: { has: course } } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        slug: true, name: true, headline: true, bio: true, subjects: true,
        education: true, specialties: true, testPrep: true, levels: true,
        photoUrl: true, photoAlt: true, courses: true, yearsTutoring: true,
      },
    });

    return rows
      .filter((r): r is typeof r & { slug: string } => Boolean(r.slug))
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        initials: initialsOf(r.name),
        headline: r.headline ?? "",
        // Stored as one block; the card renders a paragraph per entry.
        bio: (r.bio ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        subjects: r.subjects,
        education: r.education,
        specialties: r.specialties,
        testPrep: r.testPrep,
        levels: r.levels,
        years: r.yearsTutoring,
        photo: r.photoUrl,
        photoAlt: r.photoAlt,
        courses: r.courses,
        bookable: true,
      }));
  } catch (error) {
    // An empty directory is a worse failure here than elsewhere, but a 500 on
    // the marketing site is worse still.
    console.error("[tutors] could not load public tutors", error);
    return [];
  }
}

/**
 * The tutors a subject page lists in its booking panel.
 *
 * Same source and same gate as the directory — a page cannot show somebody the
 * studio has not published. `focus` is the tutor's own headline rather than a
 * per-page line, which is the one thing lost in moving these lists out of
 * source; a tutor now says once what they are the one to ask for.
 */
export async function bookingRoster(course: string): Promise<
  {
    slug: string;
    initials: string;
    name: string;
    focus: string;
    image?: string;
    blurb?: string;
    specialties: string[];
    education?: string;
    levels?: string;
    years?: number;
  }[]
> {
  const rows = await publicTutors(course);
  return rows.map((t) => ({
    slug: t.slug,
    initials: t.initials,
    name: t.name,
    focus: t.headline,
    ...(t.photo ? { image: t.photo } : {}),
    // One paragraph, not the whole profile: the card is a choice between
    // people, and the full biography lives on /tutors for anyone who wants it.
    ...(t.bio[0] ? { blurb: t.bio[0] } : {}),
    specialties: t.specialties.slice(0, 3),
    ...(t.education[0] ? { education: t.education[0] } : {}),
    ...(t.levels ? { levels: t.levels } : {}),
    ...(t.years != null ? { years: t.years } : {}),
  }));
}
