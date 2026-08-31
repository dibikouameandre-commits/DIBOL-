import type { Metadata } from "next";
import Link from "next/link";
import { FileSignature } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { contratTypeLabels } from "@/lib/validations/tools";
import { getContratHistory } from "@/server/tools/contrat";

export const metadata: Metadata = {
  title: "Mes contrats",
  robots: { index: false },
};

export default async function ContratHistoriquePage() {
  const entries = await getContratHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes contrats</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les contrats générés depuis cet appareil, pour les retélécharger ou les
          repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileSignature className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun contrat généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/contrat-simple" className={cn(buttonVariants())}>
              Créer un contrat
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/contrat-simple/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge>{contratTypeLabels[entry.contratType]}</Badge>
                <span className="font-medium">Avec {entry.partyBName}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
