"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartCount, useCartStore } from "@/store/cart-store";

export function CompanyCartButton({ entreprise }: { entreprise: string }) {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Only count items that actually belong to this company's cart context —
  // a leftover cart from the shared storefront or a different company must
  // never show up here.
  const ownItems = items.filter((item) => item.companySlug === entreprise);
  const count = mounted ? cartCount(ownItems) : 0;

  return (
    <Link
      href={`/${entreprise}/panier`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative"
      )}
    >
      <ShoppingCart />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count}
        </span>
      )}
      <span className="sr-only">Panier</span>
    </Link>
  );
}
