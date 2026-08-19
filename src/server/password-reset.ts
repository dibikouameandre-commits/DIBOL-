"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { siteConfig } from "@/config/site";
import { sendPasswordResetEmail } from "@/server/email";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  type RequestPasswordResetValues,
  type ResetPasswordValues,
} from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

function resetIdentifier(email: string) {
  return `reset-password:${email}`;
}

const GENERIC_REQUEST_MESSAGE =
  "Si un compte existe avec cet email, tu vas recevoir un lien de réinitialisation.";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

export async function requestPasswordReset(
  values: RequestPasswordResetValues
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(values);

  // Always return the same generic message, whether the input is malformed,
  // the account doesn't exist, or the email was sent — never reveal which.
  if (!parsed.success) {
    return { success: true, message: GENERIC_REQUEST_MESSAGE };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.password) {
    const identifier = resetIdentifier(email);

    // Invalidate any previously issued, still-valid reset link for this account.
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    const rawToken = generateRawToken();
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(rawToken),
        expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${siteConfig.url}/reinitialiser-mot-de-passe?email=${encodeURIComponent(email)}&token=${rawToken}`;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Password reset link for ${email}: ${resetUrl}`);
    }

    await sendPasswordResetEmail({ to: email, resetUrl });
  }

  return { success: true, message: GENERIC_REQUEST_MESSAGE };
}

export async function resetPassword(
  values: ResetPasswordValues
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { email, token, newPassword } = parsed.data;
  const identifier = resetIdentifier(email);
  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: tokenHash } },
  });

  const invalidResult: ActionResult = {
    success: false,
    error: "Ce lien de réinitialisation est invalide ou a expiré.",
  };

  if (!record) {
    return invalidResult;
  }

  if (record.expires < new Date()) {
    // Single-use + expiry cleanup: an expired token is deleted so it can
    // never be replayed even if the expiry check were ever skipped elsewhere.
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    });
    return invalidResult;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return invalidResult;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, tokenVersion: { increment: 1 } },
  });

  // Consume this token and any other outstanding reset links for the account.
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return { success: true };
}
