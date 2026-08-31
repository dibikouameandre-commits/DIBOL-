import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { ResumeDocumentForm } from "./resume-document-form";

export const metadata: Metadata = {
  title: "Résumer ou reformuler un texte gratuitement",
  description:
    "Colle un texte long et obtiens un résumé court, détaillé, ou une reformulation claire. Gratuit, en français.",
};

export default async function ResumeDocumentPage() {
  const quota = await getToolQuotaStatus("resume-document");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/resume-document/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes résumés précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Résumé / reformulation de document
        </h1>
        <p className="text-lg text-muted-foreground">
          Colle un texte long, l&apos;IA le condense ou le reformule selon le mode choisi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton texte</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu colles — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeDocumentForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
