"use client";

import { useActionState } from "react";
import { createClientAccountAction } from "@/lib/actions/client-account-actions";

/**
 * Offered on the booking confirmation page, which is the one moment we know a
 * visitor owns this booking — they are holding the URL Stripe just redirected
 * them to.
 *
 * Styled to the marketing pages rather than the admin UI: this appears on the
 * public site, and a shadcn Card here would look like a different product.
 */
export function CreateAccountForm({
  bookingId,
  email,
}: {
  bookingId: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    createClientAccountAction,
    undefined
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {/* Shown, not editable: the account is keyed to the email that paid. */}
      <p className="text-sm opacity-70">
        Signing in as <span className="font-medium">{email}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs opacity-70">Choose a password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2 text-[0.95rem] outline-none focus:border-current/50"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs opacity-70">Confirm it</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2 text-[0.95rem] outline-none focus:border-current/50"
          />
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[1rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:justify-self-start"
        style={{ backgroundColor: "var(--v3-book-fill)" }}
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      <p className="text-xs opacity-60">
        At least 8 characters. You&apos;ll use this to see your schedule and
        payments at any time.
      </p>
    </form>
  );
}
