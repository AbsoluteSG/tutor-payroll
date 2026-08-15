import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeConfigured } from "@/lib/stripe";
import { WelcomeWizard } from "./welcome-wizard";

export const metadata: Metadata = { title: "Welcome — Borough Prep" };

/**
 * The one-time form a tutor sees after accepting their invite.
 *
 * Lives OUTSIDE the (tutor) layout on purpose. That layout is what sends an
 * un-onboarded tutor here; nested inside it, this page would redirect to
 * itself forever — the same trap the parent sign-in page fell into.
 *
 * Reachable again afterwards (it does not bounce a finished tutor away) so a
 * bookmarked link is not a dead end, but it opens on the last step and says so
 * rather than pretending to be new.
 */
export default async function WelcomePage() {
  const user = await requireUser();
  if (user.role !== "TUTOR") redirect("/admin");

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      timeZone: true,
      phone: true,
      headline: true,
      bio: true,
      subjects: true,
      onboardedAt: true,
      bookable: true,
      stripeAccountId: true,
      stripeOnboarded: true,
      availabilityRules: {
        orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
    },
  });
  if (!me) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <WelcomeWizard
        name={me.name}
        done={Boolean(me.onboardedAt)}
        published={me.bookable}
        stripeConfigured={stripeConfigured()}
        stripeConnected={me.stripeOnboarded}
        stripeStarted={Boolean(me.stripeAccountId)}
        profile={{
          timeZone: me.timeZone,
          phone: me.phone ?? "",
          headline: me.headline ?? "",
          bio: me.bio ?? "",
          subjects: me.subjects.join(", "),
        }}
        availability={me.availabilityRules}
      />
    </main>
  );
}
