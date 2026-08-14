"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  categorySlug,
}: {
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
      className="gap-2"
      onClick={() => {
        addItem({ productId, slug, name, price, categorySlug });
        toast.success("Ajouté au panier", { description: name });
      }}
    >
      <ShoppingCart className="size-4" />
      Ajouter au panier
    </Button>
  );
}
