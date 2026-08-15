import Link from "next/link";

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

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/produits/${product.slug}`} className="group block h-full">
      <Card className="h-full gap-0 py-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/30">
        <ProductThumbnail
          categorySlug={product.category.slug}
          className="aspect-[4/3] rounded-t-xl"
        />
        <CardContent className="flex flex-1 flex-col gap-2 px-4 pt-4">
          <Badge variant="secondary" className="w-fit">
            {product.category.name}
          </Badge>
          <h3 className="line-clamp-1 font-heading font-semibold tracking-tight">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="mt-3 flex items-center justify-between border-t px-4 py-3">
          <span className="font-semibold tabular-nums">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Voir le produit →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
