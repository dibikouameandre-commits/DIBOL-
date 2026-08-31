"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { checkLetterContentQuality, buildCorrectiveNote } from "@/server/tools/letter-quality";
import {
  letterFormSchema,
  letterContentSchema,
  letterResultDataSchema,
  type LetterFormValues,
  type LetterContent,
  type LetterResultData,
  type LetterLength,
  type LetterTone,
} from "@/lib/validations/tools";

const TOOL_SLUG = "lettre-motivation";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours

type GenerateLetterResult =
  | { success: true; shareSlug: string }
  | { success: false; error: string };

const MATCH_SCORE_INSTRUCTIONS = `- Une offre d'emploi est fournie : calcule aussi un score de correspondance honnête entre le parcours décrit et cette offre — jamais gonflé, un score bas est normal si le profil ne correspond pas.
  - "matchScore" : un entier de 0 à 100.
  - "matchedKeywords" : les exigences de l'offre réellement couvertes par le parcours décrit.
  - "missingKeywords" : les exigences de l'offre qui ne semblent pas couvertes — ne les ajoute jamais dans les paragraphes de la lettre pour améliorer artificiellement le score, contente-toi de les signaler ici.`;

// Both selections are style/structure instructions only — they change how
// the real, already-provided information is presented, never what
// information exists. Passed into the same call that already generates the
// letter (and the match score), so choosing a length/ton never costs a
// second OpenAI request.
const LENGTH_INSTRUCTIONS: Record<LetterLength, string> = {
  courte: `Longueur COURTE : exactement 2 paragraphes, condensés et directs — (1) accroche exprimant l'intérêt pour le poste et l'entreprise en une ou deux phrases, (2) l'élément le plus pertinent du parcours réellement décrit puis une ouverture vers un entretien. Aucun développement superflu.`,
  standard: `Longueur STANDARD : 3 à 4 paragraphes — (1) accroche exprimant l'intérêt pour le poste et l'entreprise, (2) mise en avant du parcours et des compétences pertinents pour le poste, en s'appuyant sur ce qui est réellement décrit, (3) le cas échéant, un paragraphe reliant explicitement le profil à l'offre fournie, (4) conclusion professionnelle ouvrant sur un entretien.`,
  detaillee: `Longueur DÉTAILLÉE : 4 à 5 paragraphes qui développent davantage chaque élément du parcours réellement fourni (jamais en ajoutant un détail non mentionné, seulement en explicitant/contextualisant ce qui est déjà dit) — accroche, un paragraphe sur le parcours principal, un paragraphe reliant explicitement le profil à l'offre si elle est fournie, un paragraphe sur d'autres compétences ou qualités si le parcours en mentionne, conclusion ouvrant sur un entretien.`,
};

const TONE_INSTRUCTIONS: Record<LetterTone, string> = {
  professionnel: `Ton PROFESSIONNEL : formel, mesuré, vocabulaire d'entreprise classique.`,
  dynamique: `Ton DYNAMIQUE : phrases vives, verbes d'action forts, énergie perceptible — tout en restant crédible et professionnel, sans familiarité excessive.`,
  sobre: `Ton SOBRE : phrases courtes et factuelles, sans effet de style ni adjectif superflu — va à l'essentiel.`,
  convaincant: `Ton CONVAINCANT : met en avant avec assurance les faits et résultats concrets déjà mentionnés par la personne, formulations affirmées — sans jamais exagérer ni inventer un résultat non mentionné.`,
};

function buildLetterPrompt(values: LetterFormValues) {
  const system = `Tu es un rédacteur professionnel de lettres de motivation pour le marché de l'emploi en Afrique francophone.
Tu rédiges UNIQUEMENT le corps de la lettre (les paragraphes), en français, à partir du parcours réellement décrit par la personne.
Règles strictes :
- N'invente jamais une expérience, un diplôme, une compétence ou un fait sur l'entreprise qui n'est pas mentionné dans les informations fournies.
- Ne laisse jamais de texte non rempli entre crochets (par exemple "[nom de l'entreprise]") — utilise directement les vraies informations fournies (nom, poste, entreprise).
- Si une offre d'emploi est fournie, adapte le contenu en mettant en avant les éléments du parcours qui y correspondent réellement — n'invente jamais une correspondance absente du parcours décrit.
- ${LENGTH_INSTRUCTIONS[values.length]}
- ${TONE_INSTRUCTIONS[values.tone]}
- Quels que soient la longueur et le ton demandés, les règles ci-dessus contre l'invention d'informations restent absolues — seule la présentation change, jamais le contenu factuel.
- Chaque paragraphe doit être distinct — ne répète jamais la même idée ou formulation dans deux paragraphes différents.
- Ne rédige PAS l'en-tête (nom, adresse, date, objet) ni la formule de politesse finale ("Cordialement") — uniquement le corps du texte, paragraphe par paragraphe.
${values.offerText ? MATCH_SCORE_INSTRUCTIONS : "- Aucune offre d'emploi n'est fournie : n'inclus PAS les champs \"matchScore\", \"matchedKeywords\" ou \"missingKeywords\"."}
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{ "paragraphs": string[]${values.offerText ? `, "matchScore": number, "matchedKeywords": string[], "missingKeywords": string[]` : ""} }`;

  const user = `Nom complet : ${values.fullName}
Poste visé : ${values.targetRole}
Entreprise ciblée : ${values.companyName}
${values.hiringManagerName ? `Destinataire : ${values.hiringManagerName}\n` : ""}
Parcours et motivation décrits par la personne :
"""
${values.background}
"""
${
  values.offerText
    ? `\nOffre d'emploi à laquelle adapter la lettre :\n"""\n${values.offerText}\n"""`
    : ""
}`;

  return { system, user };
}

// One raw call to the model — swapping AI_MODEL (src/lib/openai.ts) for a
// different provider/model later means editing that one constant, not this
// function. Mirrors callCvModel in cv.ts.
async function callLetterModel(system: string, user: string): Promise<LetterContent | null> {
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
    console.error("Letter generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("Letter generation: model did not return valid JSON:", raw);
    return null;
  }

  const contentParsed = letterContentSchema.safeParse(contentJson);
  if (!contentParsed.success) {
    console.error("Letter generation: model output failed schema validation:", contentParsed.error);
    return null;
  }

  return contentParsed.data;
}

// Same corrective-retry-then-reject pattern as the CV tool's quality gate.
async function generateLetterContentWithQualityGate(
  system: string,
  user: string
): Promise<{ success: true; content: LetterContent } | { success: false; error: string }> {
  const firstAttempt = await callLetterModel(system, user);
  if (!firstAttempt) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  const issues = checkLetterContentQuality(firstAttempt);
  if (issues.length === 0) {
    return { success: true, content: firstAttempt };
  }

  console.warn("Letter generation: quality issues on first attempt, retrying:", issues);
  const secondAttempt = await callLetterModel(system, `${user}\n\n${buildCorrectiveNote(issues)}`);

  if (secondAttempt && checkLetterContentQuality(secondAttempt).length === 0) {
    return { success: true, content: secondAttempt };
  }

  console.error("Letter generation: quality issues persisted after retry.");
  return {
    success: false,
    error:
      "La génération n'a pas donné un résultat assez propre. Réessaie, en détaillant un peu plus ton parcours si possible.",
  };
}

export async function generateLetter(values: LetterFormValues): Promise<GenerateLetterResult> {
  const parsed = letterFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
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

  const { system, user } = buildLetterPrompt(parsed.data);

  const generated = await generateLetterContentWithQualityGate(system, user);
  if (!generated.success) {
    return { success: false, error: generated.error };
  }

  // Quota is only consumed on a genuine success — same rule as the CV tool.
  const run = await recordToolRun(TOOL_SLUG, {
    anonId,
    ipHash,
    userId: session?.user?.id,
  });

  const resultData: LetterResultData = {
    fullName: parsed.data.fullName,
    location: parsed.data.location,
    phone: parsed.data.phone,
    email: parsed.data.email,
    targetRole: parsed.data.targetRole,
    companyName: parsed.data.companyName,
    hiringManagerName: parsed.data.hiringManagerName,
    templateId: parsed.data.templateId,
    paragraphs: generated.content.paragraphs,
    createdAt: new Date().toISOString(),
    matchScore: generated.content.matchScore,
    matchedKeywords: generated.content.matchedKeywords,
    missingKeywords: generated.content.missingKeywords,
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

export async function getLetterResult(shareSlug: string): Promise<LetterResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = letterResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  return parsed.data;
}
