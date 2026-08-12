import type { Metadata } from "next";
import { CsPageV3 } from "@/components/marketing/cs-page-v3";

export const metadata: Metadata = {
  title: "Computer Science — Borough Prep",
  description:
    "C++ by hand, systems and memory, then AI-paired engineering with Claude and GPT. You cannot review what you could not have written.",
};

export default function CsCoursePage() {
  return <CsPageV3 />;
}
