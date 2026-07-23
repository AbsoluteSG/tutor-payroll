import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
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

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});

/** Require a signed-in user; redirects to /login if absent. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
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
