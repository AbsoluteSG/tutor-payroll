import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitClassForm } from "./submit-form";

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ scheduledId?: string }>;
}) {
  const user = await requireUser();
  const { scheduledId } = await searchParams;

  const rateCards = await prisma.rateCard.findMany({
    where: { tutorId: user.id, client: { active: true } },
    include: { client: { select: { id: true, paymentName: true, displayName: true } } },
    orderBy: { client: { paymentName: "asc" } },
  });

  const options = rateCards.map((rc) => ({
    clientId: rc.client.id,
    label: rc.client.displayName ?? rc.client.paymentName,
    tutorRate: rc.tutorRate.toString(),
    defaultFullCost: rc.defaultFullCost?.toString() ?? "",
  }));

  // Prefill from a scheduled class the tutor is logging.
  let initial: React.ComponentProps<typeof SubmitClassForm>["initial"];
  if (scheduledId) {
    const scheduled = await prisma.scheduledClass.findFirst({
      where: { id: scheduledId, tutorId: user.id, status: "SCHEDULED" },
    });
    if (scheduled) {
      initial = {
        scheduledId: scheduled.id,
        clientId: scheduled.clientId,
        studentName: scheduled.studentName,
        date: toDateInput(scheduled.scheduledAt),
        durationMinutes: String(scheduled.durationMinutes),
      };
    }
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Log a class</CardTitle>
        <CardDescription>
          {options.length === 0
            ? "You have no clients assigned yet — ask your manager to set up your rates."
            : initial
              ? "Logging a scheduled class — details are prefilled. Adjust anything if it changed."
              : "Your rate is preset per client and filled in automatically."}
        </CardDescription>
      </CardHeader>
      {options.length > 0 && (
        <CardContent>
          <SubmitClassForm options={options} initial={initial} />
        </CardContent>
      )}
    </Card>
  );
}
