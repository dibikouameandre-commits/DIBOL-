import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { FactureForm } from "./facture-form";

export const metadata: Metadata = {
  title: "Créer une facture ou un devis gratuitement",
  description:
    "Génère une facture ou un devis professionnel pour ton entreprise, avec calcul automatique des totaux. Gratuit, en français.",
};

export default async function FactureDevisPage() {
  const quota = await getToolQuotaStatus("facture-devis");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/facture-devis/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes documents précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Générateur de facture / devis
        </h1>
        <p className="text-lg text-muted-foreground">
          Renseigne les informations de ton entreprise, de ton client et tes lignes d&apos;articles
          — les totaux se calculent automatiquement, sans erreur.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du document</CardTitle>
          <CardDescription>
            Tous les montants sont calculés automatiquement à partir de ce que tu saisis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FactureForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
