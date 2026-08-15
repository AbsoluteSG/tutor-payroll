import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTutorOwedMap } from "@/lib/balances";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { TutorsTable } from "./tutors-table";

export default async function TutorsPage() {
  const [tutors, owedMap] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TUTOR" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        active: true,
        stripeOnboarded: true,
        onboardedAt: true,
        bookable: true,
        headline: true,
        slug: true,
        tier: true,
        defaultTutorRate: true,
        _count: { select: { availabilityRules: true } },
      },
    }),
    getTutorOwedMap(),
  ]);

  // Finished the welcome form but not yet on the public site. This is the whole
  // point of onboarding being a separate step from publishing: their details
  // arrive here and wait for a decision rather than going live on their own.
  const awaiting = tutors.filter((t) => t.onboardedAt && !t.bookable && t.active);

  return (
    <div className="grid gap-6">
      {awaiting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ready to publish</CardTitle>
            <CardDescription>
              {awaiting.length === 1
                ? "A tutor has finished their profile and is waiting to go live."
                : `${awaiting.length} tutors have finished their profiles and are waiting to go live.`}{" "}
              Set their rate and tick bookable to put them on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {awaiting.map((t) => {
                // Named explicitly so the manager knows what is still missing
                // rather than ticking "bookable" and wondering why nothing
                // appeared — the listing gate needs all of these.
                const missing = [
                  !t.slug && "roster slug",
                  !t.tier && "tier",
                  !t.defaultTutorRate && "pay rate",
                  t._count.availabilityRules === 0 && "availability",
                ].filter(Boolean) as string[];

                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.headline || "No headline yet"}
                      </p>
                      {missing.length > 0 && (
                        <p className="mt-1 text-xs text-amber-500">
                          Still needs: {missing.join(", ")}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/admin/tutors/${t.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      {missing.length > 0 ? "Complete setup" : "Publish"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutors</CardTitle>
        </CardHeader>
      <CardContent>
        {tutors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tutors yet — send an invite from the{" "}
            <Link href="/admin/invites" className="underline">
              Invites
            </Link>{" "}
            page.
          </p>
        ) : (
          <TutorsTable
            tutors={tutors.map((t) => ({
              id: t.id,
              name: t.name,
              email: t.email,
              username: t.username ?? "",
              active: t.active,
              stripeOnboarded: t.stripeOnboarded,
              owed: (owedMap.get(t.id) ?? 0).toString(),
            }))}
          />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
