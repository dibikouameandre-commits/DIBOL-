import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { PromptIaForm } from "./prompt-ia-form";

export const metadata: Metadata = {
  title: "Générer de meilleurs prompts IA gratuitement",
  description:
    "Transforme un objectif simple en prompt optimisé, prêt à coller dans ChatGPT, Claude ou tout autre assistant IA. Gratuit, en français.",
};

export default async function PromptsIaPage() {
  const quota = await getToolQuotaStatus("prompts-ia");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/prompts-ia/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes prompts précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Générateur de prompts IA</h1>
        <p className="text-lg text-muted-foreground">
          Décris ton objectif, l&apos;IA rédige 3 versions de prompt optimisé, prêtes à coller dans
          ton assistant IA préféré.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tes informations</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromptIaForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
