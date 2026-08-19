"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordValues,
  type UpdateProfileValues,
} from "@/lib/validations/profile";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateProfile(
  values: UpdateProfileValues
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/dashboard/profil");
  return { success: true };
}

export async function changePassword(
  values: ChangePasswordValues
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.password) {
    return {
      success: false,
      error: "Ce compte ne peut pas changer de mot de passe ici.",
    };
  }

  const isValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password
  );

  if (!isValid) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword, tokenVersion: { increment: 1 } },
  });

  return { success: true };
}
