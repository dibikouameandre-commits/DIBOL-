import type { Metadata } from "next";

import { CompanyCartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Panier",
  robots: { index: false },
};

export default async function CompanyPanierPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Panier</h1>
      <CompanyCartView entreprise={entreprise} />
    </div>
  );
}
