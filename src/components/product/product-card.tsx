import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  description: string;
  price: string | number;
  category: {
    name: string;
    slug: string;
  };
};

export function ProductCard({
  product,
  basePath = "",
}: {
  product: ProductCardData;
  basePath?: string;
}) {
  return (
    <Link href={`${basePath}/produits/${product.slug}`} className="group block h-full">
      <Card className="h-full gap-0 rounded-2xl py-0 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-primary/40">
        <ProductThumbnail
          categorySlug={product.category.slug}
          className="aspect-[4/3] rounded-t-2xl"
        />
        <CardContent className="flex flex-1 flex-col gap-2.5 px-5 pt-5">
          <Badge variant="secondary" className="w-fit">
            {product.category.name}
          </Badge>
          <h3 className="line-clamp-2 font-heading font-semibold tracking-tight">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between border-t px-5 py-4">
          <span className="text-base font-semibold tabular-nums">
            {formatPrice(product.price)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
            Voir le produit
            <ArrowRight className="size-3.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
