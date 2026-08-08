import type { Metadata } from "next";
import { CoursesPageV3 } from "@/components/marketing/courses-page-v3";

export const metadata: Metadata = {
  title: "Courses — Borough Prep",
  description: "SAT, SHSAT, ELA, and Math tutoring. Select a course.",
};

export default function CoursesPage() {
  return <CoursesPageV3 />;
}
