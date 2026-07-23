"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/actions/auth-actions";

/** A signed-in user updates their own name/email/username/password. */
export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const sessionUser = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username") || "",
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, username, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return { error: "Account not found." };

  const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validPassword) return { error: "Current password is incorrect." };

  const data: Prisma.UserUpdateInput = {
    name,
    email,
    username: username ? username : null,
  };
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0];
      return {
        error:
          target === "username"
            ? "That username is already taken."
            : "That email is already in use by another account.",
      };
    }
    throw err;
  }

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  return {};
}
