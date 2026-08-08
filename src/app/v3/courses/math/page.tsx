import type { Metadata } from "next";
import { MathPageV3 } from "@/components/marketing/math-page-v3";

export const metadata: Metadata = {
  title: "Mathematics — Borough Prep",
  description:
    "Pre-algebra through calculus. Mathematics is the one subject a student never has to take on trust.",
};

export default function MathCoursePage() {
  return <MathPageV3 />;
}
