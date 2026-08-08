import type { Metadata } from "next";
import { LandingPageV4 } from "@/components/marketing/landing-page-v4";

export const metadata: Metadata = {
  title: "Borough Prep — Open Knowledge Protocol",
  description:
    "Knowledge is not scarce. Access is. One student, one tutor, regardless of starting point.",
};

export default function LandingV4Page() {
  return <LandingPageV4 />;
}
