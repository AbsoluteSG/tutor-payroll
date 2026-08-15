import type { Metadata } from "next";
import { AboutPageV3 } from "@/components/marketing/about-page-v3";

export const metadata: Metadata = {
  title: "About — Borough Prep",
  description:
    "An independent tutoring studio in Brooklyn. Our story is being written — in the meantime, meet the tutors.",
  // A placeholder page should not be collecting search traffic on the strength
  // of copy that is about to be replaced.
  robots: { index: false, follow: true },
};

export default function AboutPage() {
  return <AboutPageV3 />;
}
