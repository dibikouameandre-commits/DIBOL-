"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCompanyAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { deleteProductFile, saveProductFile } from "@/lib/storage";
import { productSchema } from "@/lib/validations/product";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCompanyProducts(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  return prisma.product.findMany({
    where: { companyId: company.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompanyProductForEdit(companySlug: string, id: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.companyId !== company.id) return null;
  return product;
}

export async function getCompanyCategoriesForForm(companySlug: string) {
  const { company } = await requireCompanyAdmin(companySlug);
  return prisma.category.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    isPublished: formData.get("isPublished") === "on",
  });
}

export async function createCompanyProduct(
  companySlug: string,
  formData: FormData
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  // The category picker only ever lists this company's own categories, but
  // this guards against a forged categoryId pointing at another company's
  // category (the actual anti-leak boundary, not just a UI nicety).
  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category || category.companyId !== company.id) {
    return { success: false, error: "Catégorie invalide pour cette entreprise." };
  }

  const existing = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "Ce slug est déjà utilisé par un autre produit." };
  }

  const file = formData.get("file");
  let fileKey: string | undefined;
  let fileName: string | undefined;

  if (file instanceof File && file.size > 0) {
    const saved = await saveProductFile(file);
    fileKey = saved.key;
    fileName = saved.originalName;
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, fileKey, fileName, companyId: company.id },
  });

  revalidatePath(`/${companySlug}/admin/produits`);
  redirect(`/${companySlug}/admin/produits/${product.id}`);
}

export async function updateCompanyProduct(
  companySlug: string,
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current || current.companyId !== company.id) {
    return { success: false, error: "Produit introuvable" };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category || category.companyId !== company.id) {
    return { success: false, error: "Catégorie invalide pour cette entreprise." };
  }

  const existing = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing && existing.id !== id) {
    return { success: false, error: "Ce slug est déjà utilisé par un autre produit." };
  }

  const file = formData.get("file");
  let fileKey = current.fileKey;
  let fileName = current.fileName;

  if (file instanceof File && file.size > 0) {
    if (current.fileKey) {
      await deleteProductFile(current.fileKey);
    }
    const saved = await saveProductFile(file);
    fileKey = saved.key;
    fileName = saved.originalName;
  }

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, fileKey, fileName },
  });

  revalidatePath(`/${companySlug}/admin/produits`);
  revalidatePath(`/${companySlug}/admin/produits/${id}`);
  return { success: true };
}

export async function toggleCompanyProductPublished(
  companySlug: string,
  id: string
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.companyId !== company.id) {
    return { success: false, error: "Produit introuvable" };
  }

  await prisma.product.update({
    where: { id },
    data: { isPublished: !product.isPublished },
  });

  revalidatePath(`/${companySlug}/admin/produits`);
  return { success: true };
}

export async function deleteCompanyProduct(
  companySlug: string,
  id: string
): Promise<ActionResult> {
  const { company } = await requireCompanyAdmin(companySlug);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.companyId !== company.id) {
    return { success: false, error: "Produit introuvable" };
  }

  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (orderItemCount > 0) {
    return {
      success: false,
      error:
        "Ce produit a déjà été commandé et ne peut pas être supprimé. Dépublie-le à la place.",
    };
  }

  if (product.fileKey) {
    await deleteProductFile(product.fileKey);
  }

  await prisma.product.delete({ where: { id } });

  revalidatePath(`/${companySlug}/admin/produits`);
  return { success: true };
}
