"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExistingAnonId } from "@/lib/anon-id";
import {
  factureResultDataSchema,
  type FactureResultData,
  type FactureDocumentType,
  type FactureCurrency,
} from "@/lib/validations/tools";

// Lecture seule — l'écriture (génération + enregistrement du ToolResult)
// se fait dans src/app/api/outils/facture-devis/pdf/route.ts, au moment où
// le PDF est réellement produit. Mêmes règles d'expiration que le CV/la
// lettre (voir RESULT_TTL_MS dans cette même route).
export async function getFactureResult(shareSlug: string): Promise<FactureResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = factureResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const TOOL_SLUG = "facture-devis";
const HISTORY_LIMIT = 50;

export type FactureHistoryEntry = {
  shareSlug: string;
  documentType: FactureDocumentType;
  documentNumber: string;
  clientName: string;
  currency: FactureCurrency;
  grandTotal: number;
  createdAt: string;
};

// Étape 7 : liste des documents déjà générés par CE visiteur (via son
// anonId) ou CE compte (s'il est connecté) — jamais ceux d'un autre
// visiteur. Ne consomme aucun quota (lecture seule) et ne régénère rien —
// s'appuie entièrement sur ce que la génération a déjà enregistré (voir
// getFactureResult ci-dessus pour le même principe d'expiration).
export async function getFactureHistory(): Promise<FactureHistoryEntry[]> {
  const [anonId, session] = await Promise.all([getExistingAnonId(), auth()]);
  const userId = session?.user?.id;

  if (!anonId && !userId) return [];

  const runs = await prisma.toolRun.findMany({
    where: {
      toolSlug: TOOL_SLUG,
      OR: [...(anonId ? [{ anonId }] : []), ...(userId ? [{ userId }] : [])],
    },
    include: { result: true },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });

  const now = new Date();
  const entries: FactureHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = factureResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      documentType: parsed.data.form.documentType,
      documentNumber: parsed.data.form.documentNumber,
      clientName: parsed.data.form.clientName,
      currency: parsed.data.form.currency,
      grandTotal: parsed.data.totals.grandTotal,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
