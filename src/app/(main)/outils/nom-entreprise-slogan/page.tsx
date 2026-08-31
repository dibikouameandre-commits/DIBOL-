import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { BusinessNameForm } from "./business-name-form";

export const metadata: Metadata = {
  title: "Trouver un nom d'entreprise et un slogan gratuitement",
  description:
    "Décris ton activité et reçois 5 à 6 propositions de nom et slogan adaptées au contexte africain francophone. Gratuit, en français.",
};

export default async function NomEntrepriseSloganPage() {
  const quota = await getToolQuotaStatus("nom-entreprise-slogan");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/nom-entreprise-slogan/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes propositions précédentes
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nom d&apos;entreprise + slogan
        </h1>
        <p className="text-lg text-muted-foreground">
          Décris ton activité, l&apos;IA propose 5 à 6 noms et slogans pour te lancer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton activité</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessNameForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
