import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getToolQuotaStatus } from "@/lib/rate-limit";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { BusinessPlanForm } from "./business-plan-form";

export const metadata: Metadata = {
  title: "Générer un business plan gratuitement",
  description:
    "Décris ton projet et reçois un business plan structuré en 8 sections, téléchargeable en PDF, pour convaincre une banque ou un investisseur. Gratuit, en français.",
};

export default async function BusinessPlanPage() {
  const quota = await getToolQuotaStatus("business-plan");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Outil gratuit
          </span>
          <Link
            href="/outils/business-plan/historique"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            Mes business plans précédents
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Business plan / pitch</h1>
        <p className="text-lg text-muted-foreground">
          Décris ton projet, l&apos;IA structure un business plan clair et téléchargeable en PDF.
        </p>
      </div>

      <div className="mb-8">
        <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton projet</CardTitle>
          <CardDescription>
            Tout reste basé sur ce que tu écris — rien n&apos;est inventé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessPlanForm />
        </CardContent>
      </Card>
    </div>
  );
}
