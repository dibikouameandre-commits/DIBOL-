import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getCvTemplateMeta } from "@/lib/tools/cv-templates";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { getCvResult } from "@/server/tools/cv";
import { CvHtmlPreview } from "../../templates";
import { JobMatchForm } from "./job-match-form";

export const metadata: Metadata = {
  title: "Ton CV est prêt",
  robots: { index: false },
};

export default async function CvResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getCvResult(shareSlug);

  if (!result) {
    notFound();
  }

  const { cv, templateId, photoDataUri, matches } = result;
  const templateMeta = getCvTemplateMeta(templateId);
  const quota = await getToolQuotaStatus("generateur-cv");

  const pdfUrl = `/api/outils/cv/${shareSlug}`;
  const resultUrl = `${siteConfig.url}/outils/generateur-cv/resultat/${shareSlug}`;
  const whatsappMessage = encodeURIComponent(
    `Je viens de créer mon CV gratuitement avec DIBOL AI 🙌 Essaie aussi : ${resultUrl}`
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0 mx-auto">
          C&apos;est prêt · modèle {templateMeta.name}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ton CV est prêt, {cv.fullName.split(" ")[0]}
        </h1>
        <p className="text-lg text-muted-foreground">
          Télécharge-le en PDF, ou partage-le directement.
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

      {/* A4-proportioned "sheet of paper" framing — the preview inside is
          the exact HTML twin of the chosen PDF template. */}
      <div className="mx-auto w-full overflow-hidden rounded-lg border shadow-lg" style={{ maxWidth: 700 }}>
        <CvHtmlPreview cv={cv} templateId={templateId} photoDataUri={photoDataUri} />
      </div>

      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Adapter ce CV à une offre</CardTitle>
            <CardDescription>
              Colle une offre d&apos;emploi pour voir ton score de compatibilité et des suggestions
              concrètes — sans rien inventer dans ton CV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobMatchForm shareSlug={shareSlug} initialMatches={matches} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium">Besoin d&apos;une lettre de motivation aussi ?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/outils/lettre-motivation" className={cn(buttonVariants({ variant: "outline" }))}>
            Créer ma lettre gratuite
          </Link>
          <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
            Découvrir la boutique DIBOL AI
          </Link>
        </div>
      </div>
    </div>
  );
}
