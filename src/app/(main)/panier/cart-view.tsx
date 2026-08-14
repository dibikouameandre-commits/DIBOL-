"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartTotal, useCartStore } from "@/store/cart-store";
import { createCheckoutSession } from "@/server/checkout";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (searchParams.get("annule")) {
      toast.info("Paiement annulé", {
        description: "Ton panier a été conservé.",
      });
    }
  }, [searchParams]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
        <ShoppingBag className="size-8 text-muted-foreground" />
        <p className="font-medium">Ton panier est vide</p>
        <Link
          href="/boutique"
          className={cn(buttonVariants({ variant: "secondary" }), "mt-2")}
        >
          Explorer la boutique
        </Link>
      </div>
    );
  }

  const total = cartTotal(items);

  const handleCheckout = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      );

      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col divide-y rounded-xl border">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-4">
              <ProductThumbnail
                categorySlug={item.categorySlug}
                className="size-16 shrink-0 rounded-lg"
                iconClassName="size-6"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
                <Link
                  href={`/produits/${item.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end sm:gap-4">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setQuantity(item.productId, item.quantity - 1)
                  }
                  aria-label="Diminuer la quantité"
                >
                  <Minus />
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setQuantity(item.productId, item.quantity + 1)
                  }
                  aria-label="Augmenter la quantité"
                >
                  <Plus />
                </Button>
              </div>

              <span className="w-20 text-right font-medium">
                {formatPrice(Number(item.price) * item.quantity)}
              </span>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(item.productId)}
                aria-label="Retirer du panier"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-5">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Button
          size="lg"
          disabled={isPending}
          onClick={handleCheckout}
          className="w-full"
        >
          {isPending ? "Redirection vers Stripe..." : "Procéder au paiement"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Paiement sécurisé par Stripe. Tu seras redirigé vers une page de
          paiement sécurisée.
        </p>
      </div>
    </div>
  );
}
