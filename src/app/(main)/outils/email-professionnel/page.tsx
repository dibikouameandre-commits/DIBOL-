import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { EmailForm } from "./email-form";

export const metadata: Metadata = {
  title: "Créer un e-mail professionnel gratuitement",
  description:
    "Rédige un e-mail professionnel (relance, réclamation, demande...) en quelques minutes grâce à l'IA. Gratuit, en français.",
};

export default async function EmailProfessionnelPage() {
  const quota = await getToolQuotaStatus("email-professionnel");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/email-professionnel/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes e-mails précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Générateur d&apos;e-mail professionnel
        </h1>
        <p className="text-lg text-muted-foreground">
          Décris ta situation, l&apos;IA rédige un e-mail professionnel clair et prêt à envoyer.
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
          <EmailForm initialQuota={quota} />
        </CardContent>
      </Card>
    </div>
  );
}
