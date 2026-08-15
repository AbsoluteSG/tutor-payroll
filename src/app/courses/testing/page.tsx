import type { Metadata } from "next";
import { bookableTutors, bookingRoster } from "@/lib/booking/tutors";
import { TestingPageV3 } from "@/components/marketing/testing-page-v3";

export const metadata: Metadata = {
  title: "Specialized Testing — Borough Prep",
  description:
    "SHSAT and Digital SAT preparation. A standardized test is a solved problem.",
};

export const revalidate = 300;

export default async function TestingCoursePage() {
  return <TestingPageV3 bookable={await bookableTutors()}
      roster={await bookingRoster("testing")}
    />;
}
