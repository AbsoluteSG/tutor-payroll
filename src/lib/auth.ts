import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

/**
 * Two kinds of session share this file, and conflating them would be a
 * privilege escalation rather than a bug.
 *
 * A STAFF session's `id` is a User id and carries a Role. A CLIENT session's
 * `id` is a *Client* id and has no Role at all — a parent is not a low-privilege
 * member of staff, they are a different table. `kind` is the discriminator, and
 * every guard below branches on it before anything else: without it,
 * `requireUser()` would happily hand a parent's session to the tutor layout,
 * which would then look their id up in `User`, find nothing, and render the
 * class-logging screens anyway.
 */
export type SessionKind = "staff" | "client";

declare module "next-auth" {
  interface User {
    role?: Role;
    kind: SessionKind;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      /** Present on staff sessions only. */
      role?: Role;
      kind: SessionKind;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.identifier === "string" ? credentials.identifier.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!identifier || !password) return null;

        // An identifier containing "@" is an email; anything else is a username.
        const user = await prisma.user.findUnique({
          where: identifier.includes("@") ? { email: identifier } : { username: identifier },
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          kind: "staff" as const,
        };
      },
    }),

    /**
     * Parents. A separate provider id rather than a fallback inside the staff
     * one, so a parent's password can never be tried against a staff account or
     * the reverse — the two are reached from different pages and stay apart.
     */
    Credentials({
      id: "client",
      name: "client",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const client = await prisma.client.findUnique({ where: { email } });
        // No passwordHash means no account — a client a manager typed in by
        // hand, not someone who set a password after checkout.
        if (!client || !client.active || !client.passwordHash) return null;

        const valid = await bcrypt.compare(password, client.passwordHash);
        if (!valid) return null;

        await prisma.client.update({
          where: { id: client.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: client.id,
          email,
          name: client.displayName ?? client.paymentName,
          kind: "client" as const,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.kind = user.kind;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role | undefined;
      // Older tokens issued before parent sign-in existed carry no `kind`.
      // They can only ever have been staff, and defaulting the other way would
      // lock every signed-in manager out of the admin until they signed in
      // again.
      session.user.kind = (token.kind as SessionKind) ?? "staff";
      return session;
    },
  },
});

/**
 * Require a signed-in STAFF user; redirects to /login if absent.
 *
 * A parent's session is rejected here rather than passed through: every
 * tutor-facing screen is built on this, and a client id reaching them would be
 * looked up in `User`, miss, and render as though it were a tutor with no
 * classes — showing a parent the class-logging and payout screens.
 */
export async function requireUser() {
  const session = await auth();
  const { redirect } = await import("next/navigation");
  if (!session?.user) redirect("/login");
  if (session!.user.kind !== "staff") redirect("/account");
  return session!.user;
}

/** Require the manager role; redirects tutors to their dashboard. */
export async function requireManager() {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return user;
}

/**
 * Require a signed-in parent, and confirm the Client row still exists and is
 * active — a session outlives the row it names, and a family deactivated in the
 * admin must lose access without waiting for their JWT to expire.
 */
export async function requireClient() {
  const session = await auth();
  const { redirect } = await import("next/navigation");
  if (!session?.user) redirect("/account/login");
  if (session!.user.kind !== "client") redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id: session!.user.id },
    select: { id: true, paymentName: true, displayName: true, email: true, active: true },
  });
  if (!client || !client.active) redirect("/account/login");

  return client!;
}
