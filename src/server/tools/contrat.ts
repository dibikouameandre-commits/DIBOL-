"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildContratPrompt } from "@/lib/tools/contrat-prompt";
import {
  contratFormSchema,
  contratContentSchema,
  contratResultDataSchema,
  type ContratFormValues,
  type ContratContent,
  type ContratResultData,
  type ContratType,
} from "@/lib/validations/tools";

const TOOL_SLUG = "contrat-simple";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateContratResult =
  | { success: true; shareSlug: string }
  | { success: false; error: string };

// Un seul appel, sans mécanisme de retry qualité — même raisonnement que
// lettre-admin.ts : périmètre volontairement court et cadré (5 clauses
// fixes), pas le risque de répétition d'un CV ou d'une lettre longue.
async function callContratModel(system: string, user: string): Promise<ContratContent | null> {
  let raw: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Contrat generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Contrat generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = contratContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Contrat generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Même flux exact que generateLettreAdmin() dans lettre-admin.ts : le
// client ne reçoit que le shareSlug, jamais le contenu directement — il est
// redirigé vers la page résultat qui re-fetch via getContratResult().
export async function generateContrat(values: ContratFormValues): Promise<GenerateContratResult> {
  const parsed = contratFormSchema.safeParse(values);
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

  const { system, user } = buildContratPrompt(parsed.data);
  const content = await callContratModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus
  // ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });

  const resultData: ContratResultData = {
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

// Lecture seule — page résultat publique, aucune authentification ni quota
// requis pour consulter un lien déjà généré.
export async function getContratResult(shareSlug: string): Promise<ContratResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = contratResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type ContratHistoryEntry = {
  shareSlug: string;
  contratType: ContratType;
  partyBName: string;
  createdAt: string;
};

// Liste des contrats déjà générés par CE visiteur (anonId) ou CE compte —
// jamais ceux d'un autre visiteur. Lecture seule, ne consomme aucun quota
// et ne régénère rien.
export async function getContratHistory(): Promise<ContratHistoryEntry[]> {
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
  const entries: ContratHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = contratResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      contratType: parsed.data.form.contratType,
      partyBName: parsed.data.form.partyBName,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
