import type { Metadata } from "next";
import { TutorsPageV3 } from "@/components/marketing/tutors-page-v3";

export const metadata: Metadata = {
  title: "Our Tutors — Borough Prep",
  description:
    "Meet the Borough Prep faculty — writing and essay editing, mathematics, science, and SHSAT, SAT, and ACT preparation.",
};

export default function TutorsPage() {
  return <TutorsPageV3 />;
}
