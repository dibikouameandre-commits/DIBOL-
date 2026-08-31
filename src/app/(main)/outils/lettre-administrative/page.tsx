import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { LettreAdminForm } from "./lettre-admin-form";

export const metadata: Metadata = {
  title: "Créer une lettre administrative gratuitement",
  description:
    "Rédige une lettre administrative (attestation, congé, démission, résiliation, réclamation...) prête à envoyer. Gratuit, en français.",
};

export default async function LettreAdministrativePage() {
  const quota = await getToolQuotaStatus("lettre-administrative");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/lettre-administrative/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes lettres précédentes
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Générateur de lettre administrative
        </h1>
        <p className="text-lg text-muted-foreground">
          Décris ta situation, l&apos;IA rédige une lettre administrative claire et formelle, prête
          à imprimer ou envoyer.
        </p>
      </div>

      <div className="mb-8">
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
          <LettreAdminForm />
        </CardContent>
      </Card>
    </div>
  );
}
