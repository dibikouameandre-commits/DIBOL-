import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getLetterResult } from "@/server/tools/letter";
import { getLetterTemplateMeta } from "@/lib/tools/letter-templates";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { LetterHtmlPreview } from "../../templates";
import { LetterMatchScore } from "../../letter-match-score";

export const metadata: Metadata = {
  title: "Ta lettre de motivation est prête",
  robots: { index: false },
};

export default async function LetterResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getLetterResult(shareSlug);

  if (!result) {
    notFound();
  }

  const pdfUrl = `/api/outils/lettre/${shareSlug}`;
  const resultUrl = `${siteConfig.url}/outils/lettre-motivation/resultat/${shareSlug}`;
  const whatsappMessage = encodeURIComponent(
    `Je viens de créer ma lettre de motivation gratuitement avec DIBOL AI 🙌 Essaie aussi : ${resultUrl}`
  );
  const templateMeta = getLetterTemplateMeta(result.templateId);
  const quota = await getToolQuotaStatus("lettre-motivation");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · modèle {templateMeta.name}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ta lettre est prête, {result.fullName.split(" ")[0]}
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
        <LetterHtmlPreview letter={result} />
      </div>

      {result.matchScore !== undefined && (
        <div className="mx-auto mt-6 w-full" style={{ maxWidth: 700 }}>
          <LetterMatchScore letter={result} />
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
        <p className="font-medium">Besoin d&apos;un CV aussi ?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/outils/generateur-cv" className={cn(buttonVariants({ variant: "outline" }))}>
            Créer mon CV gratuit
          </Link>
          <Link href="/boutique" className={cn(buttonVariants({ variant: "outline" }))}>
            Découvrir la boutique DIBOL AI
          </Link>
        </div>
      </div>
    </div>
  );
}
