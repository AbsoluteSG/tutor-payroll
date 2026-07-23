"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Fires a one-time success toast after /submit redirects here, then cleans the URL. */
export function SubmittedToast() {
  const router = useRouter();

  useEffect(() => {
    toast.success("Class logged — your balance is updated");
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  return null;
}
