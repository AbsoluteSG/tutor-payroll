import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTutorOwedMap } from "@/lib/balances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      },
    }),
    getTutorOwedMap(),
  ]);

  return (
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
  );
}
