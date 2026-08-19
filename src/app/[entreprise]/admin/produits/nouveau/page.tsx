import type { Metadata } from "next";

import { getCompanyCategoriesForForm } from "@/server/company-admin/products";
import { CompanyProductForm } from "../product-form";

export const metadata: Metadata = { title: "Nouveau produit — Admin entreprise" };

export default async function NewCompanyProductPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const categories = await getCompanyCategoriesForForm(entreprise);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau produit</h1>
        <p className="text-muted-foreground">
          Ajoute un nouveau produit à la boutique de ton entreprise.
        </p>
      </div>
      <CompanyProductForm entreprise={entreprise} categories={categories} />
    </div>
  );
}
