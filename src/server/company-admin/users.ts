"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireCompanyAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import {
  createCompanyUserSchema,
  updateCompanyUserSchema,
} from "@/lib/validations/company-user";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCompanyUsers(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  return prisma.user.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

function parseCreateForm(formData: FormData) {
  return createCompanyUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
}

function parseUpdateForm(formData: FormData) {
  return updateCompanyUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
}

export async function createCompanyUser(
  companySlug: string,
  formData: FormData
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const parsed = parseCreateForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  // companyId is always this action's own resolved company — never taken
  // from the form, so it can never be pointed at another entreprise.
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      companyId: company.id,
    },
  });

  revalidatePath(`/${companySlug}/admin/utilisateurs`);
  return { success: true };
}

export async function updateCompanyUser(
  companySlug: string,
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const { session, company } = await requireCompanyAdmin(companySlug);

  if (session.user.id === userId) {
    return { success: false, error: "Tu ne peux pas modifier ton propre compte ici." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.companyId !== company.id) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  const parsed = parseUpdateForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      tokenVersion: { increment: 1 },
    },
  });

  revalidatePath(`/${companySlug}/admin/utilisateurs`);
  return { success: true };
}

export async function toggleCompanyUserActive(
  companySlug: string,
  userId: string
): Promise<ActionResult> {
  const { session, company } = await requireCompanyAdmin(companySlug);

  if (session.user.id === userId) {
    return { success: false, error: "Tu ne peux pas désactiver ton propre compte." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.companyId !== company.id) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !target.isActive, tokenVersion: { increment: 1 } },
  });

  revalidatePath(`/${companySlug}/admin/utilisateurs`);
  return { success: true };
}
