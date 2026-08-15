import type { Metadata } from "next";
import { TutorsPageV3 } from "@/components/marketing/tutors-page-v3";
import { publishedTutorProfiles } from "@/lib/booking/tutors";

export const metadata: Metadata = {
  title: "Our Tutors — Borough Prep",
  description:
    "Meet the Borough Prep faculty — writing and essay editing, mathematics, science, and SHSAT, SAT, and ACT preparation.",
};

export default async function TutorsPage() {
  // Only published tutors' own words reach the site — see the note in
  // lib/booking/tutors.ts. A draft profile stays in the admin.
  const profiles = await publishedTutorProfiles();
  return <TutorsPageV3 profiles={profiles} />;
}
