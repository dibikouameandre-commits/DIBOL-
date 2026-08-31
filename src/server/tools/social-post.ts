"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun, type ToolQuotaStatus } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildSocialPostPrompt } from "@/lib/tools/social-post-prompt";
import {
  socialPostFormSchema,
  socialPostContentSchema,
  socialPostResultDataSchema,
  type SocialPostFormValues,
  type SocialPostContent,
  type SocialPostResultData,
  type SocialPlatform,
} from "@/lib/validations/tools";

const TOOL_SLUG = "posts-reseaux-sociaux";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme les autres outils

type GenerateSocialPostResult =
  | { success: true; content: SocialPostContent; quota: ToolQuotaStatus; shareSlug: string }
  | { success: false; error: string; quota?: ToolQuotaStatus };

// Un seul appel, sans mécanisme de retry qualité — même raisonnement que
// email.ts/lettre-admin.ts : 3 courtes variantes, pas le risque de
// répétition inter-sections d'un CV ou d'une lettre longue.
async function callSocialPostModel(system: string, user: string): Promise<SocialPostContent | null> {
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
    console.error("Social post generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Social post generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = socialPostContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Social post generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Même flux exact que generateEmail() dans email.ts : le contenu est
// renvoyé directement au client pour un aperçu inline (pas de redirection
// vers une page résultat), avec un shareSlug pour le partage.
export async function generateSocialPost(
  values: SocialPostFormValues
): Promise<GenerateSocialPostResult> {
  const parsed = socialPostFormSchema.safeParse(values);
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

  const { system, user } = buildSocialPostPrompt(parsed.data);
  const content = await callSocialPostModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus
  // ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });
  const remaining = Math.max(rateLimit.remaining - 1, 0);

  const resultData: SocialPostResultData = {
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
// requis pour consulter un lien déjà généré (même principe que
// getEmailResult/getLettreAdminResult).
export async function getSocialPostResult(shareSlug: string): Promise<SocialPostResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = socialPostResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type SocialPostHistoryEntry = {
  shareSlug: string;
  platform: SocialPlatform;
  firstVariantPreview: string;
  createdAt: string;
};

// Liste des posts déjà générés par CE visiteur (anonId) ou CE compte —
// jamais ceux d'un autre visiteur. Lecture seule, ne consomme aucun quota
// et ne régénère rien — mirroir exact de getEmailHistory/getLettreAdminHistory.
export async function getSocialPostHistory(): Promise<SocialPostHistoryEntry[]> {
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
  const entries: SocialPostHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = socialPostResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    const firstVariant = parsed.data.content.variants[0]?.text ?? "";
    entries.push({
      shareSlug: run.result.shareSlug,
      platform: parsed.data.form.platform,
      firstVariantPreview:
        firstVariant.length > 80 ? `${firstVariant.slice(0, 80)}…` : firstVariant,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
