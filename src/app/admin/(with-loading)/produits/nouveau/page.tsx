import type { Metadata } from "next";

import { requireAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/app/admin/produits/product-form";

export const metadata: Metadata = { title: "Nouveau produit — Admin" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau produit</h1>
        <p className="text-muted-foreground">
          Ajoute un nouveau produit à la boutique.
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
