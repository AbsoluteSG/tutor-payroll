"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-2">
        <Label htmlFor="username">Username (optional)</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="e.g. taylor — lets you sign in without typing your email"
          pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,29}"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Choose a password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
