"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun, type ToolQuotaStatus } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildVideoScriptPrompt } from "@/lib/tools/video-script-prompt";
import {
  videoScriptFormSchema,
  videoScriptContentSchema,
  videoScriptResultDataSchema,
  type VideoScriptFormValues,
  type VideoScriptContent,
  type VideoScriptResultData,
  type VideoPlatform,
} from "@/lib/validations/tools";

const TOOL_SLUG = "script-video";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateVideoScriptResult =
  | { success: true; content: VideoScriptContent; quota: ToolQuotaStatus; shareSlug: string }
  | { success: false; error: string; quota?: ToolQuotaStatus };

// Un seul appel, sans mécanisme de retry qualité — même raisonnement que
// les autres outils texte-inline.
async function callVideoScriptModel(system: string, user: string): Promise<VideoScriptContent | null> {
  let raw: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Video script generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Video script generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = videoScriptContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Video script generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Même flux exact que generateResumeDocument()/generateSocialPost() : le
// contenu est renvoyé directement au client pour un aperçu inline (pas de
// redirection vers une page résultat), avec un shareSlug pour le partage.
export async function generateVideoScript(
  values: VideoScriptFormValues
): Promise<GenerateVideoScriptResult> {
  const parsed = videoScriptFormSchema.safeParse(values);
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

  const { system, user } = buildVideoScriptPrompt(parsed.data);
  const content = await callVideoScriptModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus
  // ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });
  const remaining = Math.max(rateLimit.remaining - 1, 0);

  const resultData: VideoScriptResultData = {
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
export async function getVideoScriptResult(shareSlug: string): Promise<VideoScriptResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = videoScriptResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type VideoScriptHistoryEntry = {
  shareSlug: string;
  platform: VideoPlatform;
  subjectPreview: string;
  createdAt: string;
};

// Liste des scripts déjà générés par CE visiteur (anonId) ou CE compte —
// jamais ceux d'un autre visiteur. Lecture seule, ne consomme aucun quota
// et ne régénère rien.
export async function getVideoScriptHistory(): Promise<VideoScriptHistoryEntry[]> {
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
  const entries: VideoScriptHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = videoScriptResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    const subject = parsed.data.form.subject;
    entries.push({
      shareSlug: run.result.shareSlug,
      platform: parsed.data.form.platform,
      subjectPreview: subject.length > 80 ? `${subject.slice(0, 80)}…` : subject,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
