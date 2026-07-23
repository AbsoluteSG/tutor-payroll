import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassTable } from "@/components/class-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const user = await requireUser();
  const rows = await prisma.classSession.findMany({
    where: { tutorId: user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { client: { select: { id: true, paymentName: true } } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ClassTable rows={rows} showClient />
      </CardContent>
    </Card>
  );
}
