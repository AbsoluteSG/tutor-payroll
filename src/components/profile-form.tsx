"use client";

import { useState } from "react";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; username: string };
}) {
  const { formAction, error, pending } = useActionFeedback(
    (fd) => updateProfileAction(undefined, fd),
    { success: "Profile updated" },
  );

  // Controlled so a post-save revalidation (which feeds new `initial` values)
  // doesn't change an uncontrolled field's defaultValue — Base UI warns on that.
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [username, setUsername] = useState(initial.username);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Optional — sign in without typing your email"
          pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,29}"
        />
      </div>

      <div className="border-t pt-4">
        <p className="mb-2 text-sm font-medium">Change password</p>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Leave blank to keep your current password"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder="Required to save any change"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
