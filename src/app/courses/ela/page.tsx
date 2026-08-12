import type { Metadata } from "next";
import { ElaPageV3 } from "@/components/marketing/ela-page-v3";

export const metadata: Metadata = {
  title: "English Language Arts — Borough Prep",
  description:
    "Close reading, argument, and the essay. Read as though the sentence were built.",
};

export default function ElaCoursePage() {
  return <ElaPageV3 />;
}
