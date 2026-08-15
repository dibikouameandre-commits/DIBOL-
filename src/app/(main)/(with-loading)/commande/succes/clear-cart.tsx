"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cart-store";

export function ClearCartOnMount() {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
