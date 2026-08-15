"use client";

import { useActionState } from "react";
import { clientLoginAction } from "@/lib/actions/client-account-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function ClientLoginForm() {
  const [state, formAction, pending] = useActionState(clientLoginAction, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Your sessions</CardTitle>
        <CardDescription>
          Sign in to see your schedule and payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          {/* No self-serve reset: there is no email sending in this stack, so
              promising a reset link would be a dead end. */}
          <p className="text-center text-xs text-muted-foreground">
            Set your password on your booking confirmation page. Forgotten it?
            Get in touch and we&apos;ll reset it.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
