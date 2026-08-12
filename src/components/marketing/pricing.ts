import { ALINA, ELLA, JARED, LEAH, MAGGIE, SAMANTHA } from "./roster";

/**
 * Published pricing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO REVERT: set SHOW_PRICING to false.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * That one flag takes the whole approach off the site — the /pricing route
 * 404s, the nav item goes, the rate lines come off the tutor cards, and the
 * chat assistant goes back to refusing to discuss money. Nothing else needs
 * touching. Once you've decided to keep it, delete the flag and the branches
 * that read it; a permanent feature flag is just dead code with a switch on it.
 *
 * The strategy, as agreed: tier by tutor seniority rather than by subject, so a
 * maths hour and an English hour cost the same and the price tracks who is
 * teaching it. Publish all of it, on the grounds that everyone else in this
 * market hides their rates and being the one studio that doesn't is itself the
 * pitch.
 */

export const SHOW_PRICING = true;

export type TierId = "junior" | "mid" | "senior";

export type Tier = {
  id: TierId;
  name: string;
  /** Online hourly rate, in whole dollars. */
  rate: number;
  /** Who sits in this tier, in a sentence. */
  who: string;
  /**
   * Which student the tier suits.
   *
   * Deliberately framed as fit rather than quality. A parent can already work
   * out why a certified teacher of eight years costs more than an undergraduate
   * — saying it out loud only sounds defensive about the price. What they
   * genuinely cannot tell is which one their own child needs.
   *
   * Framing it as quality would also devalue two thirds of the roster: four of
   * six tutors sit in Junior or Mid, and any line that argues hard for Senior
   * turns the other two tiers into the compromise option.
   */
  suits: string;
};

export const TIERS: Tier[] = [
  {
    id: "junior",
    name: "Junior",
    rate: 125,
    who: "Undergraduates a few years into tutoring, teaching within their own subject.",
    suits:
      "On-grade work: keeping up, filling the gaps left by a bad term, and getting to the point where homework stops being a fight. This is the right place for most students to start.",
  },
  {
    id: "mid",
    name: "Mid",
    rate: 175,
    who: "Graduates and specialists with a longer record, teaching through to advanced coursework.",
    suits:
      "Advanced and college-level material, or a student who is doing fine and wants to be doing well. Also the tier to ask for when the subject has moved past what a generalist can carry.",
  },
  {
    id: "senior",
    name: "Senior",
    rate: 225,
    who: "Certified teachers and postgraduates with many years in front of students.",
    suits:
      "When there is a date and a number attached — an exam to sit, a score to reach — or a student who has been stuck long enough that you want someone who has seen it before and knows where the points go.",
  },
];

export const TIER_BY_ID: Record<TierId, Tier> = Object.fromEntries(
  TIERS.map((t) => [t.id, t])
) as Record<TierId, Tier>;

/**
 * Every session is online.
 *
 * The site previously advertised in-person sessions "at your home or ours" at a
 * $25/hour premium, on the pricing page, the tutor cards, the booking panel and
 * in the chat assistant's brief. The practice does not offer them — the roster
 * is spread across Maryland, Miami, Florida and Pennsylvania — so all of it was
 * removed rather than left as an option nobody could fulfil.
 *
 * If in-person is ever offered, it needs a real answer to *who* and *where*
 * before it goes back on the site, not just a number.
 */
export const IN_PERSON = false;

/**
 * Which tier each tutor sits in.
 *
 * ⚠️ THESE ARE PROPOSALS, NOT FACTS. They are inferred from the credentials
 * each tutor supplied — certification and years teaching for Senior, degree
 * plus a longer record for Mid, current undergraduates for Junior — and nothing
 * else on this site is inferred that way on purpose.
 *
 * A tier here sets what a family is charged for a real person's time, and the
 * tutors themselves have presumably not been told which band they are in.
 * Confirm every line before this is public.
 */
export const TUTOR_TIER: Record<string, TierId> = {
  // Certified in Mathematics 7–12, eight years teaching high school.
  [MAGGIE.name]: "senior",
  // Cornell 2020, medical student, 9+ years tutoring.
  [ELLA.name]: "senior",
  // Georgetown cum laude, incoming Columbia Law, extensive tutoring.
  [SAMANTHA.name]: "mid",
  // Finance/CS double major, tutors middle school through college.
  [JARED.name]: "mid",
  // Undergraduate at Florida State, teaching experience across MS and college.
  [LEAH.name]: "junior",
  // Undergraduate at Penn State, four years tutoring.
  [ALINA.name]: "junior",
};

export type Membership = {
  name: string;
  sessions: number;
  price: number;
  note: string;
};

/**
 * Monthly memberships rather than hourly billing.
 *
 * ⚠️ Note the arithmetic before publishing: $600 for four is $150 an hour and
 * $1,150 for eight is $143.75, both of which sit between the Junior and Mid
 * hourly rates. As written, a family on a membership with a Senior tutor pays
 * well under the $225 rate — so either these are Junior/Mid-tier memberships
 * and need labelling as such, or the price should scale with the tutor's tier.
 * They are presented here exactly as given; decide which before this goes live.
 */
export const MEMBERSHIPS: Membership[] = [
  {
    name: "Four sessions",
    sessions: 4,
    price: 600,
    note: "One a week, the usual starting point.",
  },
  {
    name: "Eight sessions",
    sessions: 8,
    price: 1150,
    note: "Twice a week, or a single subject worked hard before an exam.",
  },
];

/** Per-session equivalent, for the "what am I actually paying" column. */
export function perSession(m: Membership) {
  return Math.round((m.price / m.sessions) * 100) / 100;
}

/**
 * ⚠️ The guarantee's wording is a placeholder for the shape you described —
 * a free diagnostic and a good-fit promise instead of free sessions. It
 * commits to a re-match, deliberately not to a refund, because a refund is a
 * materially bigger promise than "good fit" implies and it is not mine to
 * make. Replace both lines with the terms you actually want to be held to.
 */
export const GUARANTEE = {
  diagnostic:
    "The first sitting is a free diagnostic — scored and read back to you section by section, with no obligation to book anything.",
  fit: "If your first session isn't the right match, tell us and we'll pair you with another tutor at no charge.",
};
