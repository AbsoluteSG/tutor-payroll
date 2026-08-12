import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingPageV3 } from "@/components/marketing/pricing-page-v3";
import { SHOW_PRICING } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Pricing — Borough Prep",
  description:
    "Every rate published: hourly by tutor seniority, monthly memberships, the in-person premium, and a free diagnostic before you pay anything.",
};

export default function PricingPage() {
  // The revert switch reaches the route itself, so turning pricing off does not
  // leave a live page that nothing links to.
  if (!SHOW_PRICING) notFound();
  return <PricingPageV3 />;
}
