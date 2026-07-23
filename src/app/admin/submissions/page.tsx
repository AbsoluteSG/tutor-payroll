import { prisma } from "@/lib/prisma";
import { ClassTable } from "@/components/class-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SubmissionsPage() {
  const rows = await prisma.classSession.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      tutor: { select: { id: true, name: true } },
      client: { select: { id: true, paymentName: true } },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All submissions</CardTitle>
        <CardDescription>
          Voiding a class removes it from every balance without deleting the record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClassTable rows={rows} showTutor showClient adminLinks showVoidControls />
      </CardContent>
    </Card>
  );
}
