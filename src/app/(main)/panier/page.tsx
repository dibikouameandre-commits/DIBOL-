import type { Metadata } from "next";

import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Panier",
  description: "Ton panier DIBOL AI.",
  robots: { index: false },
};

export default function PanierPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Panier</h1>
      <CartView />
    </div>
  );
}
