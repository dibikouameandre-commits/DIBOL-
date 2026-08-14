"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cartCount, useCartStore } from "@/store/cart-store";

export function CartButton() {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = mounted ? cartCount(items) : 0;

  return (
    <Link
      href="/panier"
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
