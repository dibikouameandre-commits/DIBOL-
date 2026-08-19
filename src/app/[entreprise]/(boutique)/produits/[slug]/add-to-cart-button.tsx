"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function CompanyAddToCartButton({
  entreprise,
  productId,
  slug,
  name,
  price,
  categorySlug,
}: {
  entreprise: string;
  productId: string;
  slug: string;
  name: string;
  price: string;
  categorySlug: string;
}) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Button
      size="lg"
      onClick={() => {
        addItem({
          productId,
          slug,
          name,
          price,
          categorySlug,
          companySlug: entreprise,
        });
        toast.success("Ajouté au panier", { description: name });
      }}
    >
      <ShoppingCart className="size-4" />
      Ajouter au panier
    </Button>
  );
}
