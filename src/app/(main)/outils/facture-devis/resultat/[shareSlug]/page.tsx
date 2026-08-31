import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFactureResult } from "@/server/tools/facture";
import { FactureHtmlPreview } from "../../templates";

export const metadata: Metadata = {
  title: "Document prêt",
  robots: { index: false },
};

// Cette page est ouverte par le CLIENT qui reçoit le lien (via WhatsApp,
// email...) — jamais par la personne qui a généré le document. Pas
// d'indicateur de quota ici : celui-ci concerne l'entreprise qui utilise
// l'outil, pas son client, et n'aurait aucun sens affiché à ce dernier.
export default async function FactureResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getFactureResult(shareSlug);

  if (!result) {
    notFound();
  }

  const { form } = result;
  const docLabel = form.documentType === "devis" ? "Devis" : "Facture";
  const pdfUrl = `/api/outils/facture-devis/${shareSlug}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          {docLabel} {form.documentNumber}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {docLabel} de {form.issuerName}
        </h1>
        <p className="text-lg text-muted-foreground">
          {form.documentType === "devis"
            ? "Devis préparé pour vous — téléchargeable en PDF."
            : "Facture préparée pour vous — téléchargeable en PDF."}
        </p>
      </div>

      <div className="mb-8">
        <a href={pdfUrl} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
          <Download className="size-4" />
          Télécharger en PDF
        </a>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border shadow-lg">
        <div className="mx-auto" style={{ minWidth: 640, maxWidth: 700 }}>
          <FactureHtmlPreview data={result} templateId={form.templateId} />
        </div>
      </div>
    </div>
  );
}
