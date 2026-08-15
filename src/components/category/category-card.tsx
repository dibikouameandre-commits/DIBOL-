import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ProductThumbnail } from "@/components/product/product-thumbnail";

export function CategoryCard({
  slug,
  name,
  description,
  productCount,
}: {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
}) {
  return (
    <Link href={`/boutique?categorie=${slug}`} className="group block h-full">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/30">
        <ProductThumbnail categorySlug={slug} className="aspect-[16/9]" />
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="font-heading font-semibold tracking-tight">{name}</h3>
          {description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          <span className="mt-2 text-xs font-medium text-muted-foreground">
            {productCount} produit{productCount > 1 ? "s" : ""}
          </span>
        </div>
      </Card>
    </Link>
  );
}
