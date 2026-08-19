"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/server/company";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { createAndSendVerificationEmail } from "@/server/email-verification";

type RegisterResult = { success: true } | { success: false; error: string };

export async function registerCompanyUser(
  companySlug: string,
  values: RegisterValues
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  // The company is resolved server-side from the URL slug only — never
  // from the submitted form — so a client can't register into an
  // arbitrary companyId by tampering with the request.
  const company = await getCompanyBySlug(companySlug);
  if (!company) {
    return { success: false, error: "Entreprise introuvable" };
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
      companyId: company.id,
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
