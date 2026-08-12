import type { Metadata } from "next";
import { TestingPageV3 } from "@/components/marketing/testing-page-v3";

export const metadata: Metadata = {
  title: "Specialized Testing — Borough Prep",
  description:
    "SHSAT and Digital SAT preparation. A standardized test is a solved problem.",
};

export default function TestingCoursePage() {
  return <TestingPageV3 />;
}
