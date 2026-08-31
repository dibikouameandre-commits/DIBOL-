import type { Metadata } from "next";
import Link from "next/link";
import { Workflow } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { n8nTriggerTypeLabels } from "@/lib/validations/tools";
import { getN8nWorkflowHistory } from "@/server/tools/n8n-workflow";

export const metadata: Metadata = {
  title: "Mes workflows n8n",
  robots: { index: false },
};

export default async function N8nWorkflowHistoriquePage() {
  const entries = await getN8nWorkflowHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes workflows n8n</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les workflows générés depuis cet appareil, pour les retélécharger ou les
          repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Workflow className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun workflow généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/workflow-n8n" className={cn(buttonVariants())}>
              Créer un workflow
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/workflow-n8n/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge>{n8nTriggerTypeLabels[entry.triggerType]}</Badge>
                <span className="font-medium">{entry.workflowName}</span>
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
