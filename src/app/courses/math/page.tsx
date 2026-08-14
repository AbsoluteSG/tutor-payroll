import type { Metadata } from "next";
import { bookableTutors } from "@/lib/booking/tutors";
import { MathPageV3 } from "@/components/marketing/math-page-v3";

export const metadata: Metadata = {
  title: "Mathematics — Borough Prep",
  description:
    "Pre-algebra through calculus. Mathematics is the one subject a student never has to take on trust.",
};

/**
 * Revalidated rather than dynamic: the bookable roster changes rarely, and the
 * open times are fetched live by the panel itself, so the page stays
 * statically served and a database blip cannot take it down.
 */
export const revalidate = 300;

export default async function MathCoursePage() {
  return <MathPageV3 bookable={await bookableTutors()} />;
}
