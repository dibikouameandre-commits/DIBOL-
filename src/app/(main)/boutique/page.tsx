import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { SearchForm } from "./search-form";
import { getCategories, getProducts } from "@/server/catalog";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Découvre tous les produits digitaux DIBOL AI : workflows n8n, prompts IA et formations.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categorie, query: q }),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorie);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Boutique
        </h1>
        <p className="text-muted-foreground">
          {products.length} produit{products.length > 1 ? "s" : ""}
          {activeCategory ? ` dans « ${activeCategory.name} »` : ""}
          {q ? ` pour « ${q} »` : ""}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchForm defaultValue={q} categorie={categorie} />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/boutique"
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              !categorie
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            Tout
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/boutique?categorie=${category.slug}${q ? `&q=${q}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                categorie === category.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="font-medium">Aucun produit trouvé</p>
          <p className="text-sm text-muted-foreground">
            Essaie une autre catégorie ou un autre mot-clé.
          </p>
          <Link href="/boutique" className="mt-2">
            <Badge variant="secondary">Réinitialiser les filtres</Badge>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
