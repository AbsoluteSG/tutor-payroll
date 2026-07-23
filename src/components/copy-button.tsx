"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, toastMessage = "Copied to clipboard" }: { text: string; toastMessage?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(toastMessage);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}
