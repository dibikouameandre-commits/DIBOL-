import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBusinessNameResult } from "@/server/tools/business-name";
import { BusinessNamePreview } from "../../business-name-preview";

export const metadata: Metadata = {
  title: "Tes propositions de nom sont prêtes",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter des propositions déjà générées (même principe que le CV/la
// lettre/la facture-devis/l'e-mail/les posts/les prompts).
export default async function BusinessNameResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getBusinessNameResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tes propositions de nom sont prêtes
        </h1>
        <p className="text-lg text-muted-foreground">
          Copie ta proposition préférée pour la partager ou la déposer.
        </p>
      </div>

      <BusinessNamePreview content={result.content} />
    </div>
  );
}
