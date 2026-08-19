"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cart-store";

// The cart only ever holds items from one context at a time (isolation is
// enforced in the store itself), so a plain clear() is safe here — same as
// the shared storefront's ClearCartOnMount.
export function ClearCompanyCartOnMount() {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
