import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
      <Card className="h-full gap-0 rounded-2xl py-0 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-primary/40">
        <ProductThumbnail
          categorySlug={slug}
          className="aspect-[4/3] rounded-t-2xl"
        />
        <CardContent className="flex flex-1 flex-col gap-2.5 px-5 pt-5">
          <h3 className="font-heading font-semibold tracking-tight">
            {name}
          </h3>
          {description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between border-t px-5 py-4">
          <span className="text-sm font-medium text-muted-foreground">
            {productCount} produit{productCount > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
            Découvrir
            <ArrowRight className="size-3.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
