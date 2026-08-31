import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { ContratForm } from "./contrat-form";

export const metadata: Metadata = {
  title: "Créer un contrat simple gratuitement",
  description:
    "Génère un contrat de prestation de service ou de location simple, prêt à imprimer. Modèle simplifié, à faire relire avant signature. Gratuit, en français.",
};

export default async function ContratSimplePage() {
  const quota = await getToolQuotaStatus("contrat-simple");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/contrat-simple/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes contrats précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contrat simple</h1>
        <p className="text-lg text-muted-foreground">
          Prestation de service ou location — un contrat basique, prêt à relire avant signature.
        </p>
      </div>

      <div className="mb-8">
        <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton contrat</CardTitle>
          <CardDescription>
            Modèle simplifié fourni à titre informatif — ne remplace pas un conseil juridique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContratForm />
        </CardContent>
      </Card>
    </div>
  );
}
