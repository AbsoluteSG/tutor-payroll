import type { Metadata } from "next";
import { TutorsPageV3 } from "@/components/marketing/tutors-page-v3";
import { publicTutors } from "@/lib/booking/tutors";

export const metadata: Metadata = {
  title: "Our Tutors — Borough Prep",
  description:
    "Meet the Borough Prep faculty — writing and essay editing, mathematics, science, and SHSAT, SAT, and ACT preparation.",
};

export default async function TutorsPage() {
  // The only source of tutors on this page. Nobody appears on the public site
  // until a manager publishes them — there is no hardcoded fallback list.
  const tutors = await publicTutors();
  return <TutorsPageV3 tutors={tutors} />;
}
