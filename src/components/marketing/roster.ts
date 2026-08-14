/**
 * The tutors. Real people, one definition.
 *
 * Until now each subject page carried its own invented roster — twelve
 * fabricated tutors across four pages, all of them bookable. This replaces
 * them with the three who actually teach, defined once so a name, a spelling
 * or a photograph can never drift between the booking panel, the directory and
 * the testimonials.
 *
 * A page supplies its own `focus` line, because what a tutor is the one to ask
 * for differs by subject: Jared is "algebra through calculus" on the maths page
 * and "SHSAT, SAT and ACT" on the testing one.
 *
 * Adding someone here makes them bookable everywhere they are listed. They must
 * be a real person who has agreed to appear, with a photograph they have seen.
 */

export type RosterTutor = {
  /**
   * The join key to `User.slug` in the database.
   *
   * This file is presentation — the photograph, the initials, the name as it
   * should be spelled. Identity and money live on the User row: which tier they
   * are in, what they earn, whether they are bookable at all. A tutor appears
   * on the site from here and becomes bookable from there, and the slug is what
   * ties the two together.
   */
  slug: string;
  initials: string;
  name: string;
  /**
   * Optional. Without one, every surface falls back to a monogram plate drawn
   * in the house style rather than a grey silhouette — see tutor-portrait.tsx.
   * A tutor with no photograph is a tutor with no photograph; nothing should be
   * substituted for them.
   */
  image?: string;
};

export const SAMANTHA: RosterTutor = {
  slug: "samantha-yershov",
  initials: "SY",
  name: "Samantha Yershov",
  image: "/tutors/samantha-yershov.webp",
};

export const JARED: RosterTutor = {
  slug: "jared",
  initials: "J",
  name: "Jared",
  image: "/tutors/jared.webp",
};

export const ELLA: RosterTutor = {
  slug: "ella",
  initials: "E",
  name: "Ella",
  image: "/tutors/ella.webp",
};

export const LEAH: RosterTutor = {
  slug: "leah-livin",
  initials: "LL",
  name: "Leah Livin",
  image: "/tutors/leah-livin.webp",
};

export const ALINA: RosterTutor = {
  slug: "alina-dydyk",
  initials: "AD",
  name: "Alina Dydyk",
  image: "/tutors/alina-dydyk.webp",
};

/** No photograph supplied yet — the monogram plate stands in until there is one. */
export const MAGGIE: RosterTutor = {
  slug: "maggie",
  initials: "M",
  name: "Maggie",
};

/** Everyone, for pages that list the whole practice. */
export const ROSTER = [SAMANTHA, JARED, ELLA, LEAH, ALINA, MAGGIE];
