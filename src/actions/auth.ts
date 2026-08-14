"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";

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

  return { success: true };
}
