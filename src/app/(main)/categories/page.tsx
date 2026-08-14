import type { Metadata } from "next";

import { CategoryCard } from "@/components/category/category-card";
import { getCategories } from "@/server/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Catégories",
  description:
    "Parcours les catégories de produits digitaux DIBOL AI : automatisation, prompts, formations et templates.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
        <p className="text-muted-foreground">
          Trouve la bonne catégorie pour tes besoins.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            slug={category.slug}
            name={category.name}
            description={category.description}
            productCount={category.productCount}
          />
        ))}
      </div>
    </div>
  );
}
