import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { CvForm } from "./cv-form";

export const metadata: Metadata = {
  title: "Créer un CV gratuit en ligne, sans carte bancaire",
  description:
    "Génère un CV professionnel en quelques minutes grâce à l'IA. Gratuit, en français, pensé pour le marché de l'emploi en Afrique francophone.",
};

export default async function GenerateurCvPage() {
  const quota = await getToolQuotaStatus("generateur-cv");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Générateur de CV
        </h1>
        <p className="text-lg text-muted-foreground">
          Décris ton parcours, l&apos;IA en fait un CV clair et professionnel — prêt à
          télécharger en PDF.
        </p>
        <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tes informations</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CvForm />
        </CardContent>
      </Card>
    </div>
  );
}
