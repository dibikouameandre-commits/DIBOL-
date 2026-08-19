"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllUsers() {
  await requireSuperAdmin();
  return prisma.user.findMany({
    include: { _count: { select: { orders: true } }, company: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function setUserRole(
  userId: string,
  role: Role,
  companyId?: string
): Promise<ActionResult> {
  const session = await requireSuperAdmin();

  if (session.user.id === userId) {
    return {
      success: false,
      error: "Tu ne peux pas modifier ton propre rôle.",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  if (role === "COMPANY_ADMIN") {
    if (!companyId) {
      return {
        success: false,
        error: "Choisis une entreprise pour un administrateur d'entreprise.",
      };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return { success: false, error: "Entreprise introuvable" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "COMPANY_ADMIN", companyId, tokenVersion: { increment: 1 } },
    });
  } else if (role === "SUPER_ADMIN" || role === "ADMIN") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "SUPER_ADMIN", companyId: null, tokenVersion: { increment: 1 } },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "CLIENT", tokenVersion: { increment: 1 } },
    });
  }

  revalidatePath("/admin/utilisateurs");
  return { success: true };
}
