import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOOLS } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Outils IA gratuits",
  description:
    "CV, lettre de motivation et bientôt plus — des outils IA gratuits, en français, sans carte bancaire, pensés pour l'Afrique francophone.",
};

// A registry entry shows as "Bientôt disponible" until its own route
// exists, so the index never links to a 404.
const AVAILABLE_SLUGS = new Set([
  "generateur-cv",
  "lettre-motivation",
  "facture-devis",
  "email-professionnel",
  "lettre-administrative",
  "posts-reseaux-sociaux",
  "prompts-ia",
  "nom-entreprise-slogan",
  "business-plan",
  "resume-document",
  "script-video",
  "calcul-prix-vente",
  "contrat-simple",
  "workflow-n8n",
]);

export default function OutilsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 flex flex-col gap-3 text-center">
        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          100% gratuit, sans carte bancaire
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Outils IA gratuits DIBOL AI
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Des outils simples et concrets, en français, pour avancer aujourd&apos;hui — sans
          attendre d&apos;avoir un budget.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const isAvailable = AVAILABLE_SLUGS.has(tool.slug);
          const card = (
            <Card
              className={
                isAvailable
                  ? "h-full transition-shadow hover:shadow-md"
                  : "h-full opacity-60"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{tool.category}</Badge>
                  {!isAvailable && <Badge variant="outline">Bientôt</Badge>}
                </div>
                <CardTitle className="mt-2">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              {isAvailable && (
                <CardContent>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Essayer gratuitement <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              )}
            </Card>
          );

          return isAvailable ? (
            <Link key={tool.slug} href={`/outils/${tool.slug}`}>
              {card}
            </Link>
          ) : (
            <div key={tool.slug}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
