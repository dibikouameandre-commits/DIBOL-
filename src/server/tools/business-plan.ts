"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildBusinessPlanPrompt } from "@/lib/tools/business-plan-prompt";
import {
  businessPlanFormSchema,
  businessPlanContentSchema,
  businessPlanResultDataSchema,
  type BusinessPlanFormValues,
  type BusinessPlanContent,
  type BusinessPlanResultData,
} from "@/lib/validations/tools";

const TOOL_SLUG = "business-plan";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateBusinessPlanResult =
  | { success: true; shareSlug: string }
  | { success: false; error: string };

// Un seul appel, sans mécanisme de retry qualité pour ce premier jet — à
// revisiter si des problèmes de qualité apparaissent en usage réel, comme
// pour les autres outils texte-inline.
async function callBusinessPlanModel(system: string, user: string): Promise<BusinessPlanContent | null> {
  let raw: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Business plan generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Business plan generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = businessPlanContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Business plan generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Sous-étape (b) : même mécanisme de quota que les autres outils —
// vérifié avant l'appel IA, jamais consommé si la génération échoue.
// L'outil a désormais son entrée dans registry.ts, donc checkToolRateLimit
// peut le résoudre.
export async function generateBusinessPlan(
  values: BusinessPlanFormValues
): Promise<GenerateBusinessPlanResult> {
  const parsed = businessPlanFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const [session, anonId, ipHash] = await Promise.all([
    auth(),
    getOrCreateAnonId(),
    getRequestIpHash(),
  ]);

  const rateLimit = await checkToolRateLimit(TOOL_SLUG, { anonId, ipHash });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error:
        "Tu as atteint la limite gratuite pour aujourd'hui. Réessaie demain, ou crée un compte pour un quota plus généreux.",
    };
  }

  const { system, user } = buildBusinessPlanPrompt(parsed.data);
  const content = await callBusinessPlanModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus
  // ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });

  const resultData: BusinessPlanResultData = {
    form: parsed.data,
    content,
    createdAt: new Date().toISOString(),
  };
  const shareSlug = generateShareSlug();
  await prisma.toolResult.create({
    data: {
      runId: run.id,
      shareSlug,
      content: resultData,
      expiresAt: new Date(Date.now() + RESULT_TTL_MS),
    },
  });

  return { success: true, shareSlug };
}

// Lecture seule — page résultat, aucune authentification requise pour
// consulter un lien déjà généré (même principe que les autres outils).
export async function getBusinessPlanResult(shareSlug: string): Promise<BusinessPlanResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = businessPlanResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type BusinessPlanHistoryEntry = {
  shareSlug: string;
  projectName: string;
  createdAt: string;
};

// Liste des business plans déjà générés par CE visiteur (anonId) ou CE
// compte — jamais ceux d'un autre visiteur. Lecture seule, ne consomme
// aucun quota et ne régénère rien — mirroir exact de
// getBusinessNameHistory/getLettreAdminHistory.
export async function getBusinessPlanHistory(): Promise<BusinessPlanHistoryEntry[]> {
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
  const entries: BusinessPlanHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = businessPlanResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      projectName: parsed.data.form.projectName,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
