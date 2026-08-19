import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getCompanyProductForEdit,
  getCompanyCategoriesForForm,
} from "@/server/company-admin/products";
import { CompanyProductForm } from "../product-form";

export const metadata: Metadata = { title: "Modifier le produit — Admin entreprise" };

export default async function EditCompanyProductPage({
  params,
}: {
  params: Promise<{ entreprise: string; id: string }>;
}) {
  const { entreprise, id } = await params;
  const [product, categories] = await Promise.all([
    getCompanyProductForEdit(entreprise, id),
    getCompanyCategoriesForForm(entreprise),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modifier le produit</h1>
      </div>
      <CompanyProductForm
        entreprise={entreprise}
        categories={categories}
        product={{ ...product, price: product.price.toString() }}
      />
    </div>
  );
}
