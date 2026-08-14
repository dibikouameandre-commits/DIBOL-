"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleUserRole(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();

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

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "CLIENT" : "ADMIN" },
  });

  revalidatePath("/admin/utilisateurs");
  return { success: true };
}
