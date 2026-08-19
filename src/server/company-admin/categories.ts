"use server";

import { revalidatePath } from "next/cache";

import { requireCompanyAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/category";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCompanyCategories(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  return prisma.category.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });
}

export async function createCompanyCategory(
  companySlug: string,
  formData: FormData
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  // Slug uniqueness is still global at the database level (not yet
  // per-company) — a slug already used by any company, including another
  // one, is rejected here rather than at the database constraint.
  const existing = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await prisma.category.create({
    data: { ...parsed.data, companyId: company.id },
  });

  revalidatePath(`/${companySlug}/admin/categories`);
  return { success: true };
}

export async function updateCompanyCategory(
  companySlug: string,
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current || current.companyId !== company.id) {
    return { success: false, error: "Catégorie introuvable" };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing && existing.id !== id) {
    return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath(`/${companySlug}/admin/categories`);
  return { success: true };
}

export async function deleteCompanyCategory(
  companySlug: string,
  id: string
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current || current.companyId !== company.id) {
    return { success: false, error: "Catégorie introuvable" };
  }

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      success: false,
      error: "Cette catégorie contient des produits et ne peut pas être supprimée.",
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath(`/${companySlug}/admin/categories`);
  return { success: true };
}
