import type { Metadata } from "next";
import { LandingPageV3 } from "@/components/marketing/landing-page-v3";

export const metadata: Metadata = {
  title: "Borough Prep — An independent tutoring studio",
  description:
    "We find the idea that went missing, rebuild it, and hand it back — theirs to keep.",
};

export default function LandingV3Page() {
  return <LandingPageV3 />;
}
