import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClientLoginForm } from "./client-login-form";

export const metadata: Metadata = {
  title: "Sign in — Borough Prep",
};

/**
 * Parent sign-in. Deliberately a different page from /login, which is staff:
 * a parent typing their email into a box captioned "Tutor Payroll" and being
 * told it is wrong would have no way to know they were at the wrong door.
 *
 * Outside the /account layout on purpose — that layout requires a signed-in
 * client, which would bounce anyone trying to reach this page.
 */
export default async function ClientLoginPage() {
  const session = await auth();
  if (session?.user?.kind === "client") redirect("/account");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <ClientLoginForm />
    </main>
  );
}
