import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFactureAmount } from "@/lib/tools/facture-calc";
import { getFactureHistory } from "@/server/tools/facture";

export const metadata: Metadata = {
  title: "Mes factures et devis",
  robots: { index: false },
};

export default async function FactureHistoriquePage() {
  const entries = await getFactureHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes factures et devis</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les documents générés depuis cet appareil, pour les rouvrir ou les repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun document généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/facture-devis" className={cn(buttonVariants())}>
              Créer une facture ou un devis
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/facture-devis/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={entry.documentType === "devis" ? "secondary" : "default"}>
                    {entry.documentType === "devis" ? "Devis" : "Facture"}
                  </Badge>
                  <span className="font-medium">{entry.documentNumber}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {entry.clientName} ·{" "}
                  {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <span className="font-semibold tabular-nums">
                {formatFactureAmount(entry.grandTotal, entry.currency)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
