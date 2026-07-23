"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

type Result = { error?: string } | undefined | void;

/**
 * Wraps a server action for <form action>: tracks pending state, surfaces
 * errors inline + as a toast, and shows a success toast when the action
 * completes cleanly. Uncontrolled fields auto-reset on success (React 19).
 */
export function useActionFeedback(
  action: (formData: FormData) => Promise<Result>,
  opts?: { success?: string; onSuccess?: () => void },
) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setError(null);
        if (opts?.success) toast.success(opts.success);
        opts?.onSuccess?.();
      }
    });
  };

  return { formAction, error, pending };
}
