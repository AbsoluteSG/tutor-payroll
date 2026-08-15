"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Parent accounts: choosing a password, and signing in with it.
 *
 * There is no email sending in this stack, so an account cannot be created from
 * an emailed link and a forgotten password cannot be reset by the parent. The
 * one moment we know beyond doubt that a visitor owns a booking is when they are
 * holding its confirmation URL — /book/[id], whose id is a bearer token Stripe
 * has just redirected them to. That is where an account is offered, and the
 * booking id is what authorises it.
 */

export type AccountResult = { error?: string } | undefined;

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200, "That password is too long.");

/**
 * Set a password on the Client behind a paid booking.
 *
 * Guards, in order: the booking must exist, must be paid for, must already have
 * a client attached (commit does that), and that client must not already have a
 * password — otherwise this endpoint would let anyone holding an old booking
 * link overwrite the family's current password and take the account.
 */
export async function createClientAccountAction(
  _prev: AccountResult,
  formData: FormData
): Promise<AccountResult> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!bookingId) return { error: "Missing booking." };

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (password !== confirm) return { error: "Those passwords don't match." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      paidAt: true,
      client: { select: { id: true, email: true, passwordHash: true } },
    },
  });

  if (!booking?.paidAt || !booking.client) {
    return { error: "That booking isn't confirmed yet." };
  }
  if (!booking.client.email) {
    return { error: "This booking has no email on it — please get in touch." };
  }
  if (booking.client.passwordHash) {
    return { error: "You already have an account. Sign in instead." };
  }

  await prisma.client.update({
    where: { id: booking.client.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  try {
    await signIn("client", {
      email: booking.client.email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // The account exists now, so send them to sign in by hand rather than
      // implying it failed.
      redirect("/account/login");
    }
    throw err;
  }
  redirect("/account");
}

export async function clientLoginAction(
  _prev: AccountResult,
  formData: FormData
): Promise<AccountResult> {
  try {
    await signIn("client", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Wrong email or password." };
    }
    throw err;
  }
  redirect("/account");
}
