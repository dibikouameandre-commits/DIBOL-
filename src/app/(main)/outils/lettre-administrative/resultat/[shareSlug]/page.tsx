import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getLettreAdminResult } from "@/server/tools/lettre-admin";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { LettreAdminPreview } from "../../lettre-admin-preview";

export const metadata: Metadata = {
  title: "Ta lettre administrative est prête",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter une lettre déjà générée (même principe que le CV/la lettre de
// motivation/la facture-devis/l'e-mail).
export default async function LettreAdminResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getLettreAdminResult(shareSlug);

  if (!result) {
    notFound();
  }

  const pdfUrl = `/api/outils/lettre-administrative/${shareSlug}`;
  const resultUrl = `${siteConfig.url}/outils/lettre-administrative/resultat/${shareSlug}`;
  const whatsappMessage = encodeURIComponent(
    `Voici la lettre que j'ai préparée : ${resultUrl}`
  );
  const quota = await getToolQuotaStatus("lettre-administrative");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ta lettre est prête, {result.form.senderName.split(" ")[0]}
        </h1>
        <p className="text-lg text-muted-foreground">
          Télécharge-la en PDF, ou partage-la directement.
        </p>
      </div>

      <div className="mb-8">
        <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <a href={pdfUrl} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
          <Download className="size-4" />
          Télécharger en PDF
        </a>
        <a
          href={`https://wa.me/?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "gap-2")}
        >
          <MessageCircle className="size-4" />
          Partager sur WhatsApp
        </a>
      </div>

      <div className="mx-auto w-full overflow-hidden rounded-lg border shadow-lg" style={{ maxWidth: 700 }}>
        <LettreAdminPreview lettre={result} />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium">Besoin d&apos;un autre document ?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/outils" className={cn(buttonVariants({ variant: "outline" }))}>
            Voir tous les outils gratuits
          </Link>
        </div>
      </div>
    </div>
  );
}
