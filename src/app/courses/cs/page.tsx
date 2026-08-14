import type { Metadata } from "next";
import { bookableTutors } from "@/lib/booking/tutors";
import { CsPageV3 } from "@/components/marketing/cs-page-v3";

export const metadata: Metadata = {
  title: "Computer Science — Borough Prep",
  description:
    "C++ by hand, systems and memory, then AI-paired engineering with Claude and GPT. You cannot review what you could not have written.",
};

export const revalidate = 300;

export default async function CsCoursePage() {
  return <CsPageV3 bookable={await bookableTutors()} />;
}
