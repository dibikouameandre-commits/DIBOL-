import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { N8nWorkflowForm } from "./n8n-workflow-form";

export const metadata: Metadata = {
  title: "Générer un workflow n8n gratuitement",
  description:
    "Décris ton besoin d'automatisation et reçois un workflow n8n simple, prêt à importer. Gratuit, en français.",
};

export default async function WorkflowN8nPage() {
  const quota = await getToolQuotaStatus("workflow-n8n");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/workflow-n8n/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes workflows précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Workflow n8n assisté par IA</h1>
        <p className="text-lg text-muted-foreground">
          Décris ton besoin d&apos;automatisation, l&apos;IA génère un workflow n8n simple (2 à 6
          nœuds), prêt à importer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton besoin</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <N8nWorkflowForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
