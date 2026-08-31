"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildLettreAdminPrompt } from "@/lib/tools/lettre-admin-prompt";
import {
  lettreAdminFormSchema,
  lettreAdminContentSchema,
  lettreAdminResultDataSchema,
  type LettreAdminFormValues,
  type LettreAdminContent,
  type LettreAdminResultData,
  type LettreAdminType,
} from "@/lib/validations/tools";

const TOOL_SLUG = "lettre-administrative";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateLettreAdminResult =
  | { success: true; shareSlug: string }
  | { success: false; error: string };

// Un seul appel, sans mécanisme de retry qualité (comme email.ts, contrairement
// à cv.ts/letter.ts) : une lettre administrative reste une structure courte et
// à motif unique, sans le risque de répétition inter-sections d'un CV ou
// d'une lettre de motivation multi-paragraphes plus longue.
async function callLettreAdminModel(system: string, user: string): Promise<LettreAdminContent | null> {
  let raw: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Lettre administrative generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Lettre administrative generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = lettreAdminContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Lettre administrative generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Même flux exact que generateLetter() dans letter.ts : le client ne reçoit
// que le shareSlug, jamais le contenu directement — il est redirigé vers la
// page résultat qui re-fetch via getLettreAdminResult(). Contrairement à
// generateEmail(), pas de retour de contenu inline (pas d'aperçu sur la page
// de formulaire elle-même).
export async function generateLettreAdmin(
  values: LettreAdminFormValues
): Promise<GenerateLettreAdminResult> {
  const parsed = lettreAdminFormSchema.safeParse(values);
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

  const { system, user } = buildLettreAdminPrompt(parsed.data);
  const content = await callLettreAdminModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus ne
  // coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });

  const resultData: LettreAdminResultData = {
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
// requis pour consulter un lien déjà généré (même principe que
// getLetterResult/getEmailResult/getFactureResult).
export async function getLettreAdminResult(shareSlug: string): Promise<LettreAdminResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = lettreAdminResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type LettreAdminHistoryEntry = {
  shareSlug: string;
  lettreType: LettreAdminType;
  subject: string;
  recipientName: string;
  createdAt: string;
};

// Liste des lettres déjà générées par CE visiteur (anonId) ou CE compte —
// jamais celles d'un autre visiteur. Lecture seule, ne consomme aucun quota
// et ne régénère rien — mirroir exact de getEmailHistory/getFactureHistory.
export async function getLettreAdminHistory(): Promise<LettreAdminHistoryEntry[]> {
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
  const entries: LettreAdminHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = lettreAdminResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      lettreType: parsed.data.form.lettreType,
      subject: parsed.data.content.subject,
      recipientName: parsed.data.form.recipientName,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
