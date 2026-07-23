"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classSubmissionSchema } from "@/lib/schemas";
import { computeEarnings } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

export async function submitClassAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = classSubmissionSchema.safeParse({
    clientId: formData.get("clientId"),
    studentName: formData.get("studentName"),
    date: formData.get("date"),
    durationMinutes: formData.get("durationMinutes"),
    fullCost: formData.get("fullCost"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  // The rate always comes from the rate card, never from the form — this also
  // verifies the tutor is actually assigned to this client.
  const rateCard = await prisma.rateCard.findUnique({
    where: { clientId_tutorId: { clientId: data.clientId, tutorId: user.id } },
  });
  if (!rateCard) {
    return { error: "You are not assigned to this client. Ask your manager." };
  }

  // If this submission came from an upcoming scheduled class, mark it done in
  // the same transaction so it drops off the tutor's dashboard.
  const scheduledId = String(formData.get("scheduledId") ?? "").trim();

  await prisma.$transaction(async (tx) => {
    await tx.classSession.create({
      data: {
        tutorId: user.id,
        clientId: data.clientId,
        studentName: data.studentName,
        date: new Date(data.date),
        durationMinutes: data.durationMinutes,
        fullCost: new Prisma.Decimal(data.fullCost),
        tutorRate: rateCard.tutorRate,
        tutorEarnings: computeEarnings(rateCard.tutorRate, data.durationMinutes),
        notes: data.notes,
      },
    });

    if (scheduledId) {
      await tx.scheduledClass.updateMany({
        where: { id: scheduledId, tutorId: user.id, status: "SCHEDULED" },
        data: { status: "COMPLETED" },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect("/dashboard?submitted=1");
}
