"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun, type ToolQuotaStatus } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildN8nWorkflowPrompt } from "@/lib/tools/n8n-workflow-prompt";
import { validateN8nWorkflowIntegrity } from "@/lib/tools/n8n-workflow-validate";
import {
  n8nWorkflowFormSchema,
  n8nGenerationContentSchema,
  n8nResultDataSchema,
  type N8nWorkflowFormValues,
  type N8nGenerationContent,
  type N8nResultData,
  type N8nTriggerType,
} from "@/lib/validations/tools";

const TOOL_SLUG = "workflow-n8n";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateN8nWorkflowResult =
  | { success: true; content: N8nGenerationContent; quota: ToolQuotaStatus; shareSlug: string }
  | { success: false; error: string; quota?: ToolQuotaStatus };

// Un seul appel IA, suivi d'un DOUBLE filtre avant d'accepter le résultat :
// (1) le schéma Zod (structure JSON), (2) validateN8nWorkflowIntegrity
// (cohérence des connexions) — contrairement aux 13 outils précédents où
// une imperfection reste un texte lisible, ici un échec de l'un ou l'autre
// filtre rend le workflow inutilisable, donc rejeté entièrement plutôt que
// livré tel quel.
async function callN8nWorkflowModel(system: string, user: string): Promise<N8nGenerationContent | null> {
  let raw: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("n8n workflow generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("n8n workflow generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = n8nGenerationContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("n8n workflow generation: model output failed schema validation:", parsed.error);
    return null;
  }

  const integrityIssues = validateN8nWorkflowIntegrity(parsed.data.workflow);
  if (integrityIssues.length > 0) {
    console.error("n8n workflow generation: integrity check failed:", integrityIssues);
    return null;
  }

  return parsed.data;
}

// Même flux exact que generatePromptIa()/generateResumeDocument() : le
// contenu est renvoyé directement au client pour un aperçu inline, avec un
// shareSlug pour le partage.
export async function generateN8nWorkflow(
  values: N8nWorkflowFormValues
): Promise<GenerateN8nWorkflowResult> {
  const parsed = n8nWorkflowFormSchema.safeParse(values);
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
      quota: { remaining: 0, limit: rateLimit.limit, blocked: true },
    };
  }

  const { system, user } = buildN8nWorkflowPrompt(parsed.data);
  const content = await callN8nWorkflowModel(system, user);

  if (!content) {
    return {
      success: false,
      error:
        "La génération n'a pas produit un workflow valide. Réessaie, en détaillant un peu plus ton besoin si possible.",
    };
  }

  // Quota consommé seulement maintenant — un échec de génération ou de
  // validation ci-dessus ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });
  const remaining = Math.max(rateLimit.remaining - 1, 0);

  const resultData: N8nResultData = {
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

  return {
    success: true,
    content,
    shareSlug,
    quota: { remaining, limit: rateLimit.limit, blocked: remaining <= 0 },
  };
}

// Lecture seule — page résultat publique, aucune authentification ni quota
// requis pour consulter un lien déjà généré.
export async function getN8nWorkflowResult(shareSlug: string): Promise<N8nResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = n8nResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type N8nWorkflowHistoryEntry = {
  shareSlug: string;
  triggerType: N8nTriggerType;
  workflowName: string;
  createdAt: string;
};

// Liste des workflows déjà générés par CE visiteur (anonId) ou CE compte —
// jamais ceux d'un autre visiteur. Lecture seule, ne consomme aucun quota
// et ne régénère rien.
export async function getN8nWorkflowHistory(): Promise<N8nWorkflowHistoryEntry[]> {
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
  const entries: N8nWorkflowHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = n8nResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      triggerType: parsed.data.form.triggerType,
      workflowName: parsed.data.content.workflow.name,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
