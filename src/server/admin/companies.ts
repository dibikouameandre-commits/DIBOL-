"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations/company";

type ActionResult = { success: true } | { success: false; error: string };

export async function getAllCompanies() {
  await requireSuperAdmin();
  return prisma.company.findMany({
    include: {
      _count: { select: { users: true, products: true, categories: true, orders: true } },
    },
    orderBy: { name: "asc" },
  });
}

function parseCompanyForm(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
}

export async function createCompany(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.company.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await prisma.company.create({ data: parsed.data });

  revalidatePath("/admin/entreprises");
  return { success: true };
}

export async function updateCompany(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.company.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing && existing.id !== id) {
    return { success: false, error: "Ce slug est déjà utilisé." };
  }

  await prisma.company.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/entreprises");
  return { success: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const [userCount, productCount, categoryCount, orderCount] = await Promise.all([
    prisma.user.count({ where: { companyId: id } }),
    prisma.product.count({ where: { companyId: id } }),
    prisma.category.count({ where: { companyId: id } }),
    prisma.order.count({ where: { companyId: id } }),
  ]);

  if (userCount + productCount + categoryCount + orderCount > 0) {
    return {
      success: false,
      error:
        "Cette entreprise a encore des utilisateurs, produits, catégories ou commandes rattachés et ne peut pas être supprimée.",
    };
  }

  await prisma.company.delete({ where: { id } });

  revalidatePath("/admin/entreprises");
  return { success: true };
}
