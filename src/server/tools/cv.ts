"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { getOrCreateAnonId, getRequestIpHash } from "@/lib/anon-id";
import { checkToolRateLimit, recordToolRun } from "@/lib/rate-limit";
import { generateShareSlug } from "@/lib/tokens";
import { checkCvContentQuality, buildCorrectiveNote } from "@/server/tools/cv-quality";
import {
  cvFormSchema,
  cvContentSchema,
  cvResultDataSchema,
  jobOfferFormSchema,
  matchAnalysisSchema,
  experienceLevelLabels,
  skillLevelLabels,
  type CvFormValues,
  type CvContent,
  type CvResultData,
  type MatchAnalysis,
} from "@/lib/validations/tools";

const TOOL_SLUG = "generateur-cv";
const RESULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 jours

type GenerateCvResult =
  | { success: true; shareSlug: string }
  | { success: false; error: string };

const SKILLS_INSTRUCTIONS = `Pour chaque compétence dans "skills" :
- "name" : reprends EXACTEMENT le nom de la compétence tel qu'indiqué, sans le reformuler — le niveau choisi par la personne lui sera réassocié automatiquement après coup à partir de ce nom exact.
- N'inclus PAS de champ "level" dans ta réponse : le niveau est géré en dehors de ta réponse, ne l'invente jamais et ne le devine jamais à partir du niveau indiqué ci-dessous.
- "category" (optionnel) : un regroupement court ("Logiciels", "Techniques", "Savoir-être"...) si plusieurs compétences de nature différente sont listées. Omets ce champ si une seule catégorie suffit.`;

const ANTI_REPETITION_INSTRUCTIONS = `Règles anti-répétition, très importantes :
- Chaque point ("bullet") d'expérience doit être unique dans tout le CV — ne réutilise jamais la même formulation, ni une formulation très proche, pour deux expériences différentes.
- Varie les verbes d'action d'une expérience à l'autre sur l'ensemble du CV (n'utilise pas systématiquement le même verbe en premier mot).
- Le nombre de points par expérience doit refléter ce que la personne a réellement écrit à ce sujet : une expérience peu détaillée dans le texte source doit avoir moins de points qu'une expérience longuement décrite. N'ajoute jamais de point générique juste pour "compléter" ou équilibrer visuellement.
- Si deux expériences se ressemblent dans le texte fourni (même entreprise, postes proches), différencie leurs points à partir de ce qui est réellement dit (évolution, nouvelle responsabilité mentionnée) — n'invente jamais une différence absente du texte.`;

function formatExperiencesForPrompt(experiences: CvFormValues["experiences"]) {
  if (experiences.length === 0) return "(aucune expérience professionnelle renseignée)";
  return experiences
    .map(
      (exp, index) =>
        `${index + 1}. ${exp.title} — ${exp.company} (${exp.period})\n${exp.description}`
    )
    .join("\n\n");
}

function formatEducationForPrompt(education: CvFormValues["education"]) {
  if (education.length === 0) return "(aucune formation renseignée)";
  return education.map((edu) => `- ${edu.degree}, ${edu.school} (${edu.year})`).join("\n");
}

function formatSkillsForPrompt(skills: CvFormValues["skills"]) {
  if (skills.length === 0) return "(aucune compétence renseignée)";
  return skills
    .map((skill) => (skill.level ? `${skill.name} (${skillLevelLabels[skill.level]})` : skill.name))
    .join(", ");
}

function formatLanguagesForPrompt(languages: CvFormValues["languages"]) {
  if (languages.length === 0) return "(aucune langue renseignée)";
  return languages.map((lang) => lang.name).join(", ");
}

function buildCvPrompt(values: CvFormValues) {
  const system = `Tu es un rédacteur de CV professionnel spécialisé dans le marché de l'emploi en Afrique francophone.
La personne t'a déjà fourni son parcours sous une forme structurée (expériences, formations, compétences, langues) : ton rôle est de rédiger/améliorer la formulation, pas de deviner une structure à partir d'un texte libre.
Règles strictes :
- N'invente jamais une expérience, un diplôme, une compétence ou une langue qui n'est pas dans les informations fournies. Par exemple, si la personne ne mentionne aucune compétence en anglais, ne l'ajoute pas même si le poste visé semble en avoir besoin.
- Pour chaque expérience, transforme la description fournie en points ("bullets") : commence chaque point par un verbe d'action, reste concret et court (une ligne). Le titre, l'entreprise et la période sont déjà corrects, reprends-les tels quels (tu peux corriger une faute évidente).
- Pour chaque formation, reprends le diplôme, l'établissement et l'année tels quels (tu peux corriger une faute évidente, ne reformule pas le fond).
- Le résumé professionnel ("summary") part de ce que la personne a écrit, amélioré et adapté au poste visé et au niveau d'expérience, en 2 à 3 phrases.
- "interests" et "additionalInfo" : reprends ce que la personne a écrit, légèrement reformulé pour la clarté si besoin, sans jamais l'omettre si elle a fourni quelque chose ni en ajouter si elle n'a rien fourni.
${ANTI_REPETITION_INSTRUCTIONS}
${SKILLS_INSTRUCTIONS}
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "fullName": string,
  "targetRole": string,
  "location": string,
  "phone": string,
  "email": string,
  "summary": string,
  "experiences": [{ "title": string, "company": string, "period": string, "bullets": string[] }],
  "education": [{ "degree": string, "school": string, "year": string }],
  "skills": [{ "name": string, "category"?: string }],
  "languages": string[],
  "interests"?: string,
  "additionalInfo"?: string
}
Si aucune expérience professionnelle n'est fournie, renvoie un tableau "experiences" vide plutôt que d'en inventer une.
Si aucune formation n'est fournie, renvoie un tableau "education" vide.`;

  const user = `Nom complet : ${values.fullName}
Poste visé : ${values.targetRole}
Ville / pays : ${values.location}
Téléphone : ${values.phone}
Email : ${values.email}
Niveau d'expérience : ${experienceLevelLabels[values.experienceLevel]}

Résumé professionnel écrit par la personne :
"""
${values.summary}
"""

Expériences professionnelles :
"""
${formatExperiencesForPrompt(values.experiences)}
"""

Formations :
"""
${formatEducationForPrompt(values.education)}
"""

Compétences (le niveau entre parenthèses est indiqué pour contexte uniquement, ne le renvoie pas) :
"""
${formatSkillsForPrompt(values.skills)}
"""

Langues : ${formatLanguagesForPrompt(values.languages)}

Centres d'intérêt : ${values.interests ? `"""\n${values.interests}\n"""` : "(non renseigné)"}

Informations complémentaires : ${values.additionalInfo ? `"""\n${values.additionalInfo}\n"""` : "(non renseigné)"}`;

  return { system, user };
}

// One raw call to the model — swapping AI_MODEL (src/lib/openai.ts) for a
// different provider/model later means editing that one constant, not this
// function.
async function callCvModel(system: string, user: string): Promise<CvContent | null> {
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
    console.error("CV generation: OpenAI call failed:", error);
    return null;
  }

  if (!raw) return null;

  let contentJson: unknown;
  try {
    contentJson = JSON.parse(raw);
  } catch {
    console.error("CV generation: model did not return valid JSON:", raw);
    return null;
  }

  const contentParsed = cvContentSchema.safeParse(contentJson);
  if (!contentParsed.success) {
    console.error("CV generation: model output failed schema validation:", contentParsed.error);
    return null;
  }

  return contentParsed.data;
}

// Skill level is a fact the user already chose in the form — never left to
// the model to reproduce (see SKILLS_INSTRUCTIONS). Matched back onto the
// AI's output by exact name, case/whitespace-insensitive, since the model
// is instructed to keep names unchanged specifically so this match holds.
function applyUserSkillLevels(content: CvContent, formSkills: CvFormValues["skills"]): CvContent {
  const levelByName = new Map(
    formSkills
      .filter((skill) => skill.level)
      .map((skill) => [skill.name.trim().toLowerCase(), skill.level])
  );

  return {
    ...content,
    skills: content.skills.map((skill) => ({
      ...skill,
      level: levelByName.get(skill.name.trim().toLowerCase()),
    })),
  };
}

// The actual safeguard against repetitive/generic CVs: a deterministic
// check runs on the model's own output, and a single corrective retry is
// attempted before ever giving up. A CV that still has issues after the
// retry is rejected outright — never silently delivered.
async function generateCvContentWithQualityGate(
  system: string,
  user: string
): Promise<{ success: true; content: CvContent } | { success: false; error: string }> {
  const firstAttempt = await callCvModel(system, user);
  if (!firstAttempt) {
    return { success: false, error: "La génération a échoué. Réessaie dans quelques instants." };
  }

  const issues = checkCvContentQuality(firstAttempt);
  if (issues.length === 0) {
    return { success: true, content: firstAttempt };
  }

  console.warn("CV generation: quality issues on first attempt, retrying:", issues);
  const secondAttempt = await callCvModel(system, `${user}\n\n${buildCorrectiveNote(issues)}`);

  if (secondAttempt && checkCvContentQuality(secondAttempt).length === 0) {
    return { success: true, content: secondAttempt };
  }

  console.error("CV generation: quality issues persisted after retry.");
  return {
    success: false,
    error:
      "La génération n'a pas donné un résultat assez varié. Réessaie, en détaillant un peu plus chaque expérience si possible.",
  };
}

export async function generateCv(
  values: CvFormValues
): Promise<GenerateCvResult> {
  const parsed = cvFormSchema.safeParse(values);
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

  const { system, user } = buildCvPrompt(parsed.data);

  const generated = await generateCvContentWithQualityGate(system, user);
  if (!generated.success) {
    return { success: false, error: generated.error };
  }

  // Quota is only consumed on a genuine success — a failed/rejected
  // generation above never reaches here, and a corrective retry (when it
  // happens) never costs the visitor a second attempt.
  const run = await recordToolRun(TOOL_SLUG, {
    anonId,
    ipHash,
    userId: session?.user?.id,
  });

  const resultData: CvResultData = {
    cv: applyUserSkillLevels(generated.content, parsed.data.skills),
    templateId: parsed.data.templateId,
    photoDataUri: parsed.data.photoDataUri,
    matches: [],
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

export async function getCvResult(shareSlug: string): Promise<CvResultData | null> {
  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result) return null;
  if (result.expiresAt && result.expiresAt < new Date()) return null;

  const parsed = cvResultDataSchema.safeParse(result.content);
  if (!parsed.success) return null;

  // Stored oldest-first (each new analysis is appended) — sorted here so the
  // newest match is always first, matching how a freshly-added one is
  // displayed on the client (see job-match-form.tsx) without a reload.
  const matches = [...parsed.data.matches].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { ...parsed.data, matches };
}

type MatchCvResult =
  | { success: true; match: MatchAnalysis }
  | { success: false; error: string };

function buildMatchPrompt(cvSummary: string, offerText: string) {
  const system = `Tu compares un CV réel à une offre d'emploi, pour aider la personne à voir où elle correspond et où elle pourrait s'améliorer — en français.
Règles strictes :
- Tu ne juges QUE ce qui est réellement dans le CV fourni. Tu n'ajoutes jamais une compétence ou une expérience au CV lui-même.
- "matchedKeywords" : les exigences de l'offre qui sont bien couvertes par le CV.
- "missingKeywords" : les exigences de l'offre qui ne semblent pas couvertes par le CV.
- "suggestions" : des conseils concrets et honnêtes pour améliorer la candidature (reformuler une expérience existante pour mieux répondre à l'offre, mentionner un détail déjà réel mais pas assez mis en avant...). Ne suggère jamais d'inventer une compétence absente — signale plutôt l'écart.
- "score" : un entier de 0 à 100 reflétant la correspondance globale, honnête (un score bas est normal si le profil ne correspond pas, ce n'est pas un échec à éviter).
Réponds uniquement avec un objet JSON valide respectant exactement ce schéma :
{ "score": number, "matchedKeywords": string[], "missingKeywords": string[], "suggestions": string[] }`;

  const user = `Résumé du CV (nom, poste visé, résumé, expériences, compétences) :
"""
${cvSummary}
"""

Offre d'emploi :
"""
${offerText}
"""`;

  return { system, user };
}

export async function matchCvToOffer(
  shareSlug: string,
  offerText: string
): Promise<MatchCvResult> {
  const parsedOffer = jobOfferFormSchema.safeParse({ offerText });
  if (!parsedOffer.success) {
    return {
      success: false,
      error: parsedOffer.error.issues[0]?.message ?? "Offre invalide",
    };
  }

  const result = await prisma.toolResult.findUnique({ where: { shareSlug } });
  if (!result || (result.expiresAt && result.expiresAt < new Date())) {
    return { success: false, error: "CV introuvable ou expiré." };
  }

  const resultParsed = cvResultDataSchema.safeParse(result.content);
  if (!resultParsed.success) {
    return { success: false, error: "CV introuvable ou expiré." };
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

  const cv = resultParsed.data.cv;
  const cvSummary = JSON.stringify({
    fullName: cv.fullName,
    targetRole: cv.targetRole,
    summary: cv.summary,
    experiences: cv.experiences,
    education: cv.education,
    skills: cv.skills,
    languages: cv.languages,
  });

  const { system, user } = buildMatchPrompt(cvSummary, parsedOffer.data.offerText);

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
    console.error("CV matching: OpenAI call failed:", error);
    return { success: false, error: "L'analyse a échoué. Réessaie dans quelques instants." };
  }

  if (!raw) {
    return { success: false, error: "L'analyse a échoué. Réessaie." };
  }

  let matchJson: unknown;
  try {
    matchJson = JSON.parse(raw);
  } catch {
    console.error("CV matching: model did not return valid JSON:", raw);
    return { success: false, error: "L'analyse a échoué. Réessaie." };
  }

  const matchParsed = matchAnalysisSchema
    .omit({ id: true, createdAt: true, offerExcerpt: true })
    .safeParse(matchJson);
  if (!matchParsed.success) {
    console.error("CV matching: model output failed schema validation:", matchParsed.error);
    return { success: false, error: "L'analyse a échoué. Réessaie." };
  }

  // Quota consumed only now — a failed AI call above never reaches here.
  await recordToolRun(TOOL_SLUG, { anonId, ipHash, userId: session?.user?.id });

  const match: MatchAnalysis = {
    id: generateShareSlug(),
    createdAt: new Date().toISOString(),
    offerExcerpt: parsedOffer.data.offerText.slice(0, 160),
    ...matchParsed.data,
  };

  const updatedData: CvResultData = {
    ...resultParsed.data,
    matches: [...resultParsed.data.matches, match],
  };

  await prisma.toolResult.update({
    where: { shareSlug },
    data: { content: updatedData },
  });

  return { success: true, match };
}
