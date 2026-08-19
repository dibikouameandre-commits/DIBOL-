"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { createAndSendVerificationEmail } from "@/server/email-verification";

type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(
  values: RegisterValues
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  try {
    await createAndSendVerificationEmail(email);
  } catch (error) {
    // Verification email is best-effort: registration must still succeed
    // even if token creation or sending fails.
    console.error("Failed to send verification email:", error);
  }

  return { success: true };
}
