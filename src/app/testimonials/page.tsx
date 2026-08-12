import type { Metadata } from "next";
import { TestimonialsPageV3 } from "@/components/marketing/testimonials-page-v3";

export const metadata: Metadata = {
  title: "Testimonials — Borough Prep",
  description:
    "What families say after working with Borough Prep — online SHSAT, SAT, English, and Mathematics tutoring.",
};

export default function TestimonialsPage() {
  return <TestimonialsPageV3 />;
}
