"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { deleteProductFile, saveProductFile } from "@/lib/storage";
import { productSchema } from "@/lib/validations/product";
import { getDefaultCompanyId } from "@/server/company";

export async function getAllProducts() {
  await requireSuperAdmin();
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductForEdit(id: string) {
  await requireSuperAdmin();
  return prisma.product.findUnique({ where: { id } });
}

type ActionResult = { success: true } | { success: false; error: string };

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

export async function createProduct(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const companyId = await getDefaultCompanyId();
  if (!companyId) {
    return {
      success: false,
      error: "Entreprise par défaut introuvable — impossible de créer le produit.",
    };
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
    data: { ...parsed.data, fileKey, fileName, companyId },
  });

  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  redirect(`/admin/produits/${product.id}`);
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) {
    return { success: false, error: "Produit introuvable" };
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

  revalidatePath("/admin/produits");
  revalidatePath(`/produits/${parsed.data.slug}`);
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductPublished(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Produit introuvable" };
  }

  await prisma.product.update({
    where: { id },
    data: { isPublished: !product.isPublished },
  });

  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
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

  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true };
}
