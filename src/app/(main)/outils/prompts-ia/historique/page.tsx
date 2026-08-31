import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { promptTaskTypeLabels } from "@/lib/validations/tools";
import { getPromptIaHistory } from "@/server/tools/prompt-ia";

export const metadata: Metadata = {
  title: "Mes prompts IA",
  robots: { index: false },
};

export default async function PromptIaHistoriquePage() {
  const entries = await getPromptIaHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes prompts IA</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les prompts générés depuis cet appareil, pour les recopier ou les repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun prompt généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/prompts-ia" className={cn(buttonVariants())}>
              Créer des prompts
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/prompts-ia/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge>{promptTaskTypeLabels[entry.taskType]}</Badge>
                <span className="font-medium">{entry.goalPreview}</span>
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
