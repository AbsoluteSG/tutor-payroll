"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { EnquiryStatus } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "CLOSED"];

/**
 * Move a lead along. Three states rather than a delete: an enquiry that has
 * been answered is a record of a conversation with a family, and the inbox is
 * more useful with the answered ones still in it.
 */
export async function setEnquiryStatusAction(
  formData: FormData
): Promise<ActionResult> {
  const me = await requireManager();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return { error: "Missing enquiry" };
  if (!STATUSES.includes(status as EnquiryStatus)) {
    return { error: "Unknown status" };
  }

  await prisma.enquiry.update({
    where: { id },
    data: {
      status: status as EnquiryStatus,
      // Records who picked it up, so a shared inbox does not become two people
      // ringing the same family.
      handledById: status === "NEW" ? null : me.id,
      handledAt: status === "NEW" ? null : new Date(),
    },
  });

  revalidatePath("/admin/enquiries");
  return {};
}

/** What happened on the phone. */
export async function saveEnquiryNotesAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireManager();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing enquiry" };
  const notes = String(formData.get("staffNotes") ?? "").trim().slice(0, 2000);

  await prisma.enquiry.update({
    where: { id },
    data: { staffNotes: notes || null },
  });

  revalidatePath("/admin/enquiries");
  return {};
}

/**
 * Turn a lead into a real client, then drop the manager on that client's page
 * to set up rates.
 *
 * `Client.paymentName` is unique and is a human name, so collisions are real —
 * two families called "Smith" is not an edge case. Rather than failing, the
 * second one is disambiguated with the email, which is the thing that actually
 * differs. The manager can rename it afterwards.
 */
export async function convertEnquiryToClientAction(
  formData: FormData
): Promise<ActionResult> {
  await requireManager();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing enquiry" };

  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) return { error: "That enquiry no longer exists." };

  const candidates = [enquiry.name, `${enquiry.name} (${enquiry.email})`];
  let clientId: string | null = null;

  for (const paymentName of candidates) {
    try {
      const created = await prisma.client.create({
        data: {
          paymentName,
          displayName: enquiry.name,
          notes: [
            `From a website enquiry on ${enquiry.createdAt.toISOString().slice(0, 10)}.`,
            enquiry.email,
            enquiry.phone,
            enquiry.message,
          ]
            .filter(Boolean)
            .join("\n"),
        },
        select: { id: true },
      });
      clientId = created.id;
      break;
    } catch (error) {
      // P2002 is the unique-name collision, and it is expected — try the next
      // candidate. Anything else is a real failure.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }
  }

  if (!clientId) {
    return {
      error: "A client with that name already exists — add them manually.",
    };
  }

  await prisma.enquiry.update({
    where: { id },
    data: { status: "CONTACTED", handledAt: new Date() },
  });

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${clientId}`);
}
