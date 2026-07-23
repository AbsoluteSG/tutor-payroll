import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitClassForm } from "./submit-form";

export default async function SubmitPage() {
  const user = await requireUser();
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

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Log a class</CardTitle>
        <CardDescription>
          {options.length === 0
            ? "You have no clients assigned yet — ask your manager to set up your rates."
            : "Your rate is preset per client and filled in automatically."}
        </CardDescription>
      </CardHeader>
      {options.length > 0 && (
        <CardContent>
          <SubmitClassForm options={options} />
        </CardContent>
      )}
    </Card>
  );
}
