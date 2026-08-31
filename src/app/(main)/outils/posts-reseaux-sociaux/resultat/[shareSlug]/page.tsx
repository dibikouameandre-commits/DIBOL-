import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSocialPostResult } from "@/server/tools/social-post";
import { socialPlatformLabels } from "@/lib/validations/tools";
import { SocialPostPreview } from "../../social-post-preview";

export const metadata: Metadata = {
  title: "Tes posts sont prêts",
  robots: { index: false },
};

// Page publique — aucune authentification, aucun quota requis pour
// consulter des posts déjà générés (même principe que le CV/la lettre/la
// facture-devis/l'e-mail).
export default async function SocialPostResultPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const result = await getSocialPostResult(shareSlug);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <span className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:mx-0">
          C&apos;est prêt · {socialPlatformLabels[result.form.platform]}
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tes posts sont prêts</h1>
        <p className="text-lg text-muted-foreground">
          Copie la variante de ton choix et colle-la directement dans l&apos;application du réseau.
        </p>
      </div>

      <SocialPostPreview content={result.content} />
    </div>
  );
}
