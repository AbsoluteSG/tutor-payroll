import type { Metadata } from "next";
import { bookableTutors } from "@/lib/booking/tutors";
import { ElaPageV3 } from "@/components/marketing/ela-page-v3";

export const metadata: Metadata = {
  title: "English Language Arts — Borough Prep",
  description:
    "Close reading, argument, and the essay. Read as though the sentence were built.",
};

export const revalidate = 300;

export default async function ElaCoursePage() {
  return <ElaPageV3 bookable={await bookableTutors()} />;
}
