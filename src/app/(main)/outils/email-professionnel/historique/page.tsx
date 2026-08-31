import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { emailTypeLabels } from "@/lib/validations/tools";
import { getEmailHistory } from "@/server/tools/email";

export const metadata: Metadata = {
  title: "Mes e-mails",
  robots: { index: false },
};

export default async function EmailHistoriquePage() {
  const entries = await getEmailHistory();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Outil gratuit
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mes e-mails</h1>
        <p className="text-lg text-muted-foreground">
          Retrouve les e-mails générés depuis cet appareil, pour les rouvrir ou les repartager.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Mail className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun e-mail généré pour l&apos;instant depuis cet appareil.
            </p>
            <Link href="/outils/email-professionnel" className={cn(buttonVariants())}>
              Créer un e-mail
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.shareSlug}
              href={`/outils/email-professionnel/resultat/${entry.shareSlug}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge>{emailTypeLabels[entry.emailType]}</Badge>
                <span className="font-medium">{entry.subject}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {entry.recipientName ? `À ${entry.recipientName} · ` : ""}
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
