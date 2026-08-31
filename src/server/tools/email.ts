"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun, type ToolQuotaStatus } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { buildEmailPrompt } from "@/lib/tools/email-prompt";
import {
  emailFormSchema,
  emailContentSchema,
  emailResultDataSchema,
  type EmailFormValues,
  type EmailContent,
  type EmailResultData,
  type EmailType,
} from "@/lib/validations/tools";

const TOOL_SLUG = "email-professionnel";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours, comme le CV/la lettre/la facture-devis

type GenerateEmailResult =
  | { success: true; content: EmailContent; quota: ToolQuotaStatus; shareSlug: string }
  | { success: false; error: string; quota?: ToolQuotaStatus };

// Un seul appel, sans mécanisme de retry qualité (contrairement à
// src/server/tools/cv.ts) : un e-mail est une structure bien plus courte et
// simple qu'un CV, sans les risques de répétition inter-expériences qui
// justifiaient ce mécanisme là-bas.
async function callEmailModel(system: string, user: string): Promise<EmailContent | null> {
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
    console.error("Email generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Email generation: model did not return valid JSON:", raw);
    return null;
  }

  const parsed = emailContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    console.error("Email generation: model output failed schema validation:", parsed.error);
    return null;
  }

  return parsed.data;
}

// Étape 5 : même mécanisme de quota que le CV/la lettre/la facture-devis —
// vérifié avant l'appel IA, jamais consommé si la génération échoue.
// Étape 6 : chaque génération réussie est maintenant aussi enregistrée
// (ToolRun + ToolResult, même mécanisme que le CV/la lettre/la facture-devis)
// pour permettre le partage par lien — voir
// src/app/(main)/outils/email-professionnel/resultat/[shareSlug].
export async function generateEmail(values: EmailFormValues): Promise<GenerateEmailResult> {
  const parsed = emailFormSchema.safeParse(values);
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

  const { system, user } = buildEmailPrompt(parsed.data);
  const content = await callEmailModel(system, user);

  if (!content) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  // Quota consommé seulement maintenant — un appel IA qui échoue ci-dessus
  // ne coûte jamais une génération.
  const run = await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });
  const remaining = Math.max(rateLimit.remaining - 1, 0);

  const resultData: EmailResultData = {
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

// Lecture seule — pour la page résultat publique (aucune authentification,
// aucun quota requis pour consulter un lien déjà généré, même principe que
// getFactureResult/getCvResult).
export async function getEmailResult(shareSlug: string): Promise<EmailResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = emailResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}

const HISTORY_LIMIT = 50;

export type EmailHistoryEntry = {
  shareSlug: string;
  emailType: EmailType;
  subject: string;
  recipientName?: string;
  createdAt: string;
};

// Étape 7 : liste des e-mails déjà générés par CE visiteur (via son anonId)
// ou CE compte (s'il est connecté) — jamais ceux d'un autre visiteur. Ne
// consomme aucun quota (lecture seule) et ne régénère rien — même principe
// exact que getFactureHistory() dans src/server/tools/facture.ts.
export async function getEmailHistory(): Promise<EmailHistoryEntry[]> {
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
  const entries: EmailHistoryEntry[] = [];

  for (const run of runs) {
    if (!run.result) continue;
    if (run.result.expiresAt && run.result.expiresAt < now) continue;

    const parsed = emailResultDataSchema.safeParse(run.result.content);
    if (!parsed.success) continue;

    entries.push({
      shareSlug: run.result.shareSlug,
      emailType: parsed.data.form.emailType,
      subject: parsed.data.content.subject,
      recipientName: parsed.data.form.recipientName,
      createdAt: parsed.data.createdAt,
    });
  }

  return entries;
}
