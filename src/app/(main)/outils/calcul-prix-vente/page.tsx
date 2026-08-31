import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { PricingCalcForm } from "./pricing-calc-form";

export const metadata: Metadata = {
  title: "Calculer un prix de vente rentable gratuitement",
  description:
    "Calcule ton prix de vente à partir de ton coût de revient et de la marge souhaitée, ou teste la marge d'un prix de vente. Gratuit, en français.",
};

export default async function CalculPrixVentePage() {
  const quota = await getToolQuotaStatus("calcul-prix-vente");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calcul prix de vente / marge</h1>
        <p className="text-lg text-muted-foreground">
          Indique ton coût de revient, l&apos;outil calcule un prix de vente rentable — ou teste la
          marge d&apos;un prix que tu as en tête.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton calcul</CardTitle>
          <CardDescription>Aucune donnée n&apos;est conservée après le calcul.</CardDescription>
        </CardHeader>
        <CardContent>
          <PricingCalcForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
