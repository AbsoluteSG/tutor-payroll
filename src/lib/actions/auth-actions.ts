"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptInviteSchema } from "@/lib/schemas";

export type ActionResult = { error?: string } | undefined;

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email/username or password" };
    }
    throw err;
  }
  redirect("/");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function acceptInviteAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    username: formData.get("username") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { token, password, username } = parsed.data;

  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is invalid or has expired." };
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return { error: "An account with this email already exists. Try logging in." };
  }

  if (username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return { error: "That username is already taken — pick another." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.create({
      data: { email: invite.email, name: invite.name, role: invite.role, passwordHash, username },
    }),
    prisma.inviteToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  await signIn("credentials", {
    identifier: invite.email,
    password,
    redirect: false,
  });
  // Straight into the welcome form for tutors. Sending them to "/" first would
  // bounce them here anyway via the tutor layout, but through the marketing
  // site, which is a confusing first thing to see after accepting an invite.
  redirect(invite.role === "TUTOR" ? "/welcome" : "/");
}
