import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBusinessNameHistory } from "@/server/tools/business-name";

export const metadata: Metadata = {
  title: "Mes propositions de nom",
  robots: { index: false },
};

export default async function BusinessNameHistoriquePage() {
  const entries = await getBusinessNameHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes propositions de nom</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les propositions générées depuis cet appareil, pour les recopier ou les
          repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Lightbulb className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucune proposition générée pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/nom-entreprise-slogan" className={cn(buttonVariants())}>
              Trouver un nom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/nom-entreprise-slogan/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge>{entry.firstSuggestionName}</Badge>
                <span className="font-medium">{entry.activityPreview}</span>
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
