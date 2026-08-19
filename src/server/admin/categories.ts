"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/category";
import { getDefaultCompanyId } from "@/server/company";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCategories() {
  await requireSuperAdmin();
  return prisma.category.findMany({
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

export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const companyId = await getDefaultCompanyId();
  if (!companyId) {
    return {
      success: false,
      error: "Entreprise par défaut introuvable — impossible de créer la catégorie.",
    };
  }

  const existing = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await prisma.category.create({ data: { ...parsed.data, companyId } });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

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

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      success: false,
      error: "Cette catégorie contient des produits et ne peut pas être supprimée.",
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}
