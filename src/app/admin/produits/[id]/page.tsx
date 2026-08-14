import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/server/admin/guard";
import { prisma } from "@/lib/prisma";
import { getProductForEdit } from "@/server/admin/products";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Modifier le produit — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Modifier « {product.name} »
        </h1>
      </div>
      <ProductForm
        categories={categories}
        product={{ ...product, price: product.price.toString() }}
      />
    </div>
  );
}
