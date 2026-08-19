import { CategoryCard } from "@/components/category/category-card";
import { getCompanyBySlug } from "@/server/company";
import { getCompanyCategories } from "@/server/company-catalog";

export default async function CompanyCategoriesPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const company = await getCompanyBySlug(entreprise);
  if (!company) return null;

  const categories = await getCompanyCategories(company.id);
  const base = `/${entreprise}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Catégories
        </h1>
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
            basePath={base}
          />
        ))}
      </div>
    </div>
  );
}
