import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBusinessPlanHistory } from "@/server/tools/business-plan";

export const metadata: Metadata = {
  title: "Mes business plans",
  robots: { index: false },
};

export default async function BusinessPlanHistoriquePage() {
  const entries = await getBusinessPlanHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes business plans</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les business plans générés depuis cet appareil, pour les retélécharger ou les
          repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun business plan généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/business-plan" className={cn(buttonVariants())}>
              Créer un business plan
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/business-plan/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{entry.projectName}</span>
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
