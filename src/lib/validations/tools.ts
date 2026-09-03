import { z } from "zod";

// Both photoDataUri (CV) and issuerLogoDataUri (facture/devis) are meant to
// hold exactly what compressImageToDataUri() produces client-side (see
// src/lib/client/compress-image.ts): a small re-encoded raster image. But
// these are plain Server Action inputs — nothing stops a request crafted
// directly (bypassing the browser UI) from sending an arbitrary string
// instead. A length check alone doesn't catch that: this also checks the
// declared MIME against the base64 payload's actual magic bytes, so only a
// real image of a type we ever produce/expect gets through. Uses atob()
// rather than Buffer so this file stays safe to import from the client
// forms that already reuse it with zodResolver.
const IMAGE_DATA_URI_PATTERN = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

function isValidImageDataUri(value: string): boolean {
  const match = value.match(IMAGE_DATA_URI_PATTERN);
  if (!match) return false;
  const [, mime, base64] = match;

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    return false;
  }
  if (binary.length < 12) return false;
  const byteAt = (i: number) => binary.charCodeAt(i);

  if (mime === "jpeg") {
    return byteAt(0) === 0xff && byteAt(1) === 0xd8 && byteAt(2) === 0xff;
  }
  if (mime === "png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (b, i) => byteAt(i) === b
    );
  }
  // webp: "RIFF" + 4-byte size + "WEBP"
  return (
    byteAt(0) === 0x52 &&
    byteAt(1) === 0x49 &&
    byteAt(2) === 0x46 &&
    byteAt(3) === 0x46 &&
    byteAt(8) === 0x57 &&
    byteAt(9) === 0x45 &&
    byteAt(10) === 0x42 &&
    byteAt(11) === 0x50
  );
}

const imageDataUriSchema = (message: string) =>
  z
    .string()
    .max(400_000, message)
    .refine(isValidImageDataUri, "Fichier image invalide");

// Structured, repeatable sections — the user enters their real facts
// (dates, titles, diplomas) directly rather than describing them in prose;
// the AI's job (see buildCvPrompt in server/tools/cv.ts) shifts from
// "infer a structure from free text" to "rewrite what's already structured
// into professional wording", which is both simpler and more reliable.
export const cvExperienceInputSchema = z.object({
  title: z.string().min(1, "Indique le poste"),
  company: z.string().min(1, "Indique l'entreprise"),
  period: z.string().min(1, "Indique la période"),
  description: z
    .string()
    .min(1, "Décris brièvement ce que tu faisais")
    .max(1000, "1000 caractères maximum par expérience"),
});
export type CvExperienceInput = z.infer<typeof cvExperienceInputSchema>;

export const cvEducationInputSchema = z.object({
  degree: z.string().min(1, "Indique le diplôme"),
  school: z.string().min(1, "Indique l'établissement"),
  year: z.string().min(1, "Indique l'année"),
});
export type CvEducationInput = z.infer<typeof cvEducationInputSchema>;

const cvSkillLevelInputSchema = z.enum(["notion", "intermediaire", "avance", "expert"]);

export const cvSkillInputSchema = z.object({
  name: z.string().min(1, "Indique une compétence"),
  level: cvSkillLevelInputSchema.optional(),
});
export type CvSkillInput = z.infer<typeof cvSkillInputSchema>;

export const cvLanguageInputSchema = z.object({
  name: z.string().min(1, "Indique une langue"),
});
export type CvLanguageInput = z.infer<typeof cvLanguageInputSchema>;

export const cvFormSchema = z.object({
  fullName: z.string().min(2, "Indique ton nom complet"),
  targetRole: z.string().min(2, "Indique le poste visé"),
  location: z.string().min(2, "Indique ta ville et ton pays"),
  phone: z.string().min(6, "Indique un numéro de téléphone"),
  email: z.string().email("Email invalide"),
  experienceLevel: z.enum(["debutant", "intermediaire", "confirme"]),
  // Short professional profile/summary — not the full parcours anymore,
  // since experiences/education are now their own structured sections.
  summary: z
    .string()
    .min(20, "Décris ton profil en une ou deux phrases")
    .max(800, "800 caractères maximum"),
  experiences: z.array(cvExperienceInputSchema).max(10, "10 expériences maximum"),
  education: z.array(cvEducationInputSchema).max(8, "8 formations maximum"),
  skills: z.array(cvSkillInputSchema).max(20, "20 compétences maximum"),
  languages: z.array(cvLanguageInputSchema).max(10, "10 langues maximum"),
  interests: z.string().max(300, "300 caractères maximum").optional(),
  additionalInfo: z.string().max(500, "500 caractères maximum").optional(),
  templateId: z.enum(["classique", "moderne", "etudiant", "cadre", "commercial"]),
  // A compressed JPEG data URI, resized client-side before it ever reaches
  // the server — see src/lib/client/compress-image.ts. Capped generously
  // above what real compressed output should reach; this is a defensive
  // backstop, not the primary size control.
  photoDataUri: imageDataUriSchema("La photo est trop volumineuse").optional(),
});

export type CvFormValues = z.infer<typeof cvFormSchema>;
export type TemplateId = CvFormValues["templateId"];

export const experienceLevelLabels: Record<
  CvFormValues["experienceLevel"],
  string
> = {
  debutant: "Débutant(e) / premier emploi",
  intermediaire: "Intermédiaire (2 à 5 ans)",
  confirme: "Confirmé(e) (plus de 5 ans)",
};

const skillLevelSchema = z.enum(["notion", "intermediaire", "avance", "expert"]);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

export const skillLevelLabels: Record<SkillLevel, string> = {
  notion: "Notions",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
  expert: "Expert",
};

// The shape the AI must return — validated before it's ever stored or
// rendered, so a malformed model response fails cleanly instead of
// producing a broken CV or a rendering crash.
export const cvContentSchema = z.object({
  fullName: z.string(),
  targetRole: z.string(),
  location: z.string(),
  phone: z.string(),
  email: z.string(),
  summary: z.string(),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      period: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      // A year "looks numeric" to the model, so it sometimes returns it as
      // a JSON number (e.g. 2014) instead of a string — same class of
      // mismatch as interests/additionalInfo above. Coerced to string so
      // nothing downstream (templates, cv-density.ts) needs to change.
      year: z.union([z.string(), z.number()]).transform(String),
    })
  ),
  // "level" is chosen directly by the user in the form now (see
  // cvSkillInputSchema) — the model only ever passes it through unchanged.
  // "category" stays model-assigned: a short grouping label ("Logiciels",
  // "Techniques"...) when several skills of a different nature are listed,
  // never invented as a fact, just an organizational label.
  skills: z.array(
    z.object({
      name: z.string(),
      level: skillLevelSchema.optional(),
      category: z.string().optional(),
    })
  ),
  languages: z.array(z.string()).optional(),
  // Both lightly reformatted from the user's own free text, never invented.
  // .nullable() alongside .optional(): when nothing was provided for these
  // (the common case — both are facultatif in the form), the model is just
  // as likely to answer with an explicit `null` as to omit the key entirely
  // — .optional() alone only accepts the latter, rejecting the former and
  // failing generation outright. Both mean exactly the same thing here, so
  // both are accepted; nothing downstream (templates, cv-density.ts) needs
  // to change, since `null` is already falsy in every `cv.interests && ...`
  // check they use.
  interests: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
});

export type CvContent = z.infer<typeof cvContentSchema>;
export type CvSkill = CvContent["skills"][number];

// One job-offer analysis run against an already-generated CV. Several can
// accumulate on the same result (someone applying to more than one job),
// so each carries its own id and timestamp.
export const matchAnalysisSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  offerExcerpt: z.string(),
  score: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

// What's actually stored in ToolResult.content — the AI-generated CV plus
// presentation/user choices (template, photo) and the accumulated list of
// job-offer analyses run against it.
export const cvResultDataSchema = z.object({
  cv: cvContentSchema,
  templateId: z.enum(["classique", "moderne", "etudiant", "cadre", "commercial"]),
  photoDataUri: z.string().optional(),
  matches: z.array(matchAnalysisSchema).default([]),
});

export type CvResultData = z.infer<typeof cvResultDataSchema>;

export const jobOfferFormSchema = z.object({
  offerText: z
    .string()
    .min(30, "Colle le texte de l'offre (au moins quelques phrases)")
    .max(6000, "Le texte de l'offre est limité à 6000 caractères"),
});

export type JobOfferFormValues = z.infer<typeof jobOfferFormSchema>;

export const letterLengthSchema = z.enum(["courte", "standard", "detaillee"]);
export type LetterLength = z.infer<typeof letterLengthSchema>;

export const letterLengthLabels: Record<LetterLength, string> = {
  courte: "Courte",
  standard: "Standard",
  detaillee: "Détaillée",
};

export const letterToneSchema = z.enum(["professionnel", "dynamique", "sobre", "convaincant"]);
export type LetterTone = z.infer<typeof letterToneSchema>;

export const letterToneLabels: Record<LetterTone, string> = {
  professionnel: "Professionnel",
  dynamique: "Dynamique",
  sobre: "Sobre",
  convaincant: "Convaincant",
};

// Visual presentation only — never touches what generateLetter() produces.
// See src/lib/tools/letter-templates.ts for each template's identity.
export const letterTemplateSchema = z.enum([
  "classique",
  "moderne",
  "elegant",
  "minimaliste",
  "creatif",
]);
export type LetterTemplateId = z.infer<typeof letterTemplateSchema>;

// What the visitor fills in for the cover-letter tool. offerText is
// optional — the letter is usable without a specific offer, but tailoring
// improves when one is pasted (same free-text philosophy as the CV tool).
export const letterFormSchema = z.object({
  fullName: z.string().min(2, "Indique ton nom complet"),
  location: z.string().min(2, "Indique ta ville et ton pays"),
  phone: z.string().min(6, "Indique un numéro de téléphone"),
  email: z.string().email("Email invalide"),
  targetRole: z.string().min(2, "Indique le poste visé"),
  companyName: z.string().min(2, "Indique le nom de l'entreprise"),
  hiringManagerName: z.string().max(120).optional(),
  templateId: letterTemplateSchema,
  length: letterLengthSchema,
  tone: letterToneSchema,
  background: z
    .string()
    .min(40, "Décris ton parcours et ta motivation en au moins quelques phrases")
    .max(4000, "Décris ton parcours en 4000 caractères maximum"),
  offerText: z
    .string()
    .max(6000, "Le texte de l'offre est limité à 6000 caractères")
    .optional(),
});

export type LetterFormValues = z.infer<typeof letterFormSchema>;

// The AI only ever produces the body paragraphs — the header, date, object
// line and sign-off are composed deterministically from form data (see
// src/server/tools/letter-pdf.tsx), which keeps every factual/structural
// element outside the model's reach entirely.
// matchScore/matchedKeywords/missingKeywords are only ever set when an offer
// was pasted — same honesty rules as the CV tool's matchAnalysisSchema: the
// score reflects the real gap, never padded, and a missing keyword is never
// quietly worked into the letter itself to inflate it.
export const letterContentSchema = z.object({
  paragraphs: z.array(z.string().min(1)).min(2).max(5),
  matchScore: z.number().min(0).max(100).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
});

export type LetterContent = z.infer<typeof letterContentSchema>;

export const letterResultDataSchema = z.object({
  fullName: z.string(),
  location: z.string(),
  phone: z.string(),
  email: z.string(),
  targetRole: z.string(),
  companyName: z.string(),
  hiringManagerName: z.string().optional(),
  templateId: letterTemplateSchema,
  paragraphs: z.array(z.string()),
  createdAt: z.string(),
  matchScore: z.number().min(0).max(100).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
});

export type LetterResultData = z.infer<typeof letterResultDataSchema>;

// ---------------------------------------------------------------------------
// Générateur de facture / devis — Étape 1 : modèle de données et calculs
// uniquement (pas de formulaire, pas de PDF, pas de templateId pour l'instant
// — ajoutés aux étapes suivantes). Contrairement au CV et à la lettre, cet
// outil est délibérément 100% déterministe : aucun champ ici (montants,
// quantités, remises, totaux, numéro, date) ne dépasse jamais par une IA.
// Une assistance rédactionnelle IA facultative pourra être ajoutée plus tard
// mais ne devra jamais toucher la logique financière définie ici.

export const factureDocumentTypeSchema = z.enum(["facture", "devis"]);
export type FactureDocumentType = z.infer<typeof factureDocumentTypeSchema>;

export const factureDocumentTypeLabels: Record<FactureDocumentType, string> = {
  facture: "Facture",
  devis: "Devis",
};

// Devises courantes pour des PME/artisans francophones — Afrique de l'Ouest
// (XOF), Afrique centrale (XAF), Guinée (GNF), Maghreb (MAD/TND/DZD), plus
// EUR/USD pour une clientèle internationale. Une valeur unique par choix,
// pas un champ libre, pour garantir un affichage cohérent sur le document.
export const factureCurrencySchema = z.enum([
  "XOF",
  "XAF",
  "GNF",
  "MAD",
  "TND",
  "DZD",
  "EUR",
  "USD",
]);
export type FactureCurrency = z.infer<typeof factureCurrencySchema>;

export const factureCurrencyLabels: Record<FactureCurrency, string> = {
  XOF: "Franc CFA (XOF)",
  XAF: "Franc CFA (XAF)",
  GNF: "Franc guinéen (GNF)",
  MAD: "Dirham marocain (MAD)",
  TND: "Dinar tunisien (TND)",
  DZD: "Dinar algérien (DZD)",
  EUR: "Euro (EUR)",
  USD: "Dollar américain (USD)",
};

// Étape 4 : 5 modèles visuels distincts, comme pour le CV et la lettre de
// motivation — voir src/lib/tools/facture-templates.ts pour l'identité de
// chacun. Le choix du modèle ne change jamais le contenu ni les calculs.
export const factureTemplateSchema = z.enum([
  "classique",
  "moderne",
  "elegant",
  "minimaliste",
  "creatif",
]);
export type FactureTemplateId = z.infer<typeof factureTemplateSchema>;

// Une ligne d'article/service telle que saisie par l'utilisateur — jamais
// générée ni modifiée par une IA. quantity/unitPrice/discountPercent sont
// de simples nombres ; le total de la ligne est TOUJOURS recalculé par
// src/lib/tools/facture-calc.ts, jamais saisi directement ni fourni par le
// client sans revalidation côté serveur (même principe que
// src/server/checkout.ts qui revalide les prix côté serveur).
export const factureLineItemSchema = z.object({
  description: z.string().min(1, "Décris l'article ou la prestation"),
  quantity: z
    .number({ error: "Indique une quantité valide" })
    .positive("La quantité doit être supérieure à 0"),
  unitPrice: z
    .number({ error: "Indique un prix valide" })
    .nonnegative("Le prix unitaire ne peut pas être négatif"),
  discountPercent: z.number().min(0).max(100).optional(),
});
export type FactureLineItem = z.infer<typeof factureLineItemSchema>;

// What the visitor fills in. No AI involved anywhere in this schema —
// every field is either free text (never sent to a model) or a plain
// number/date used only in arithmetic.
export const factureFormSchema = z.object({
  documentType: factureDocumentTypeSchema,
  templateId: factureTemplateSchema,
  documentNumber: z.string().min(1, "Indique un numéro de document"),
  documentDate: z.string().min(1, "Indique une date"),
  dueDate: z.string().optional(),

  issuerName: z.string().min(2, "Indique le nom de ton entreprise"),
  issuerAddress: z.string().optional(),
  issuerPhone: z.string().optional(),
  issuerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  issuerTaxId: z.string().optional(),
  issuerLogoDataUri: imageDataUriSchema("Le logo est trop volumineux").optional(),

  clientName: z.string().min(2, "Indique le nom du client"),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),

  currency: factureCurrencySchema,
  lineItems: z.array(factureLineItemSchema).min(1, "Ajoute au moins une ligne"),
  globalDiscountPercent: z.number().min(0).max(100).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),

  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});
export type FactureFormValues = z.infer<typeof factureFormSchema>;

// The computed, authoritative numbers — always produced by
// computeFactureTotals(), never entered directly by the user and never
// trusted from a client submission without being recomputed server-side.
export const factureLineTotalSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountPercent: z.number(),
  lineSubtotal: z.number(),
  lineDiscountAmount: z.number(),
  lineTotal: z.number(),
});
export type FactureLineTotal = z.infer<typeof factureLineTotalSchema>;

export const factureTotalsSchema = z.object({
  lines: z.array(factureLineTotalSchema),
  subtotal: z.number(),
  globalDiscountPercent: z.number(),
  globalDiscountAmount: z.number(),
  totalAfterDiscount: z.number(),
  taxRatePercent: z.number(),
  taxAmount: z.number(),
  grandTotal: z.number(),
});
export type FactureTotals = z.infer<typeof factureTotalsSchema>;

// What will eventually be stored in ToolResult.content — the raw form data
// (templateId included) plus the authoritative computed totals, so the
// stored document never needs to re-run the calculation to be displayed or
// downloaded identically later.
export const factureResultDataSchema = z.object({
  form: factureFormSchema,
  totals: factureTotalsSchema,
  createdAt: z.string(),
});
export type FactureResultData = z.infer<typeof factureResultDataSchema>;

// ---------------------------------------------------------------------------
// Générateur d'e-mail professionnel — Étape 1 : schémas uniquement (pas de
// formulaire, pas d'appel OpenAI réel — voir src/lib/tools/email-prompt.ts
// pour la construction du prompt, câblé à un vrai appel IA à l'Étape 3).
// Contrairement à la facture/devis, cet outil a besoin d'une IA (comme le CV
// et la lettre) : il structure un e-mail à partir d'une situation décrite en
// langage libre, sans jamais inventer un fait absent de cette description.

export const emailTypeSchema = z.enum([
  "relance",
  "reclamation",
  "demande",
  "remerciement",
  "excuse",
  "suivi",
  "autre",
]);
export type EmailType = z.infer<typeof emailTypeSchema>;

export const emailTypeLabels: Record<EmailType, string> = {
  relance: "Relance",
  reclamation: "Réclamation",
  demande: "Demande",
  remerciement: "Remerciement",
  excuse: "Excuse",
  suivi: "Suivi",
  autre: "Autre",
};

// Ce que l'utilisateur remplit. Aucun champ n'est envoyé tel quel comme
// contenu final de l'e-mail — tout passe par l'IA (Étape 3), qui structure
// sans jamais ajouter un fait absent de "context".
// Étape 4 : ton ajustable — un seul champ supplémentaire, transmis au même
// appel IA que le reste (aucun coût supplémentaire), pour ne pas complexifier
// le formulaire au-delà du nécessaire.
export const emailToneSchema = z.enum(["formel", "neutre", "chaleureux", "ferme"]);
export type EmailTone = z.infer<typeof emailToneSchema>;

export const emailToneLabels: Record<EmailTone, string> = {
  formel: "Formel",
  neutre: "Neutre",
  chaleureux: "Chaleureux",
  ferme: "Ferme",
};

export const emailFormSchema = z.object({
  emailType: emailTypeSchema,
  tone: emailToneSchema,
  context: z
    .string()
    .min(20, "Décris la situation en au moins quelques mots")
    .max(3000, "Décris la situation en 3000 caractères maximum"),
  senderName: z.string().min(2, "Indique ton nom"),
  senderRole: z.string().max(150).optional(),
  recipientName: z.string().max(150).optional(),
  recipientCompany: z.string().max(150).optional(),
});
export type EmailFormValues = z.infer<typeof emailFormSchema>;

// Ce que l'IA doit renvoyer — structure minimale d'un e-mail professionnel.
// Validé avant tout affichage, exactement comme cvContentSchema/
// letterContentSchema : une réponse IA qui ne respecte pas ce schéma est
// rejetée plutôt qu'affichée telle quelle.
export const emailContentSchema = z.object({
  subject: z.string(),
  greeting: z.string(),
  body: z.string(),
  closing: z.string(),
  signatureName: z.string(),
  signatureRole: z.string().optional(),
});
export type EmailContent = z.infer<typeof emailContentSchema>;

// Ce qui sera enregistré dans ToolResult.content une fois la génération
// câblée (Étape 3). templateId sera ajouté à l'Étape 4, une fois les modèles
// définis — même séquence que pour la facture/devis (voir
// factureResultDataSchema ci-dessus, qui n'avait pas non plus de templateId
// avant que les modèles n'existent).
export const emailResultDataSchema = z.object({
  form: emailFormSchema,
  content: emailContentSchema,
  createdAt: z.string(),
});
export type EmailResultData = z.infer<typeof emailResultDataSchema>;

// Outil n°5 : Lettre administrative. Contrairement à l'e-mail (ton ajustable),
// une lettre administrative reste uniformément formelle quel que soit son
// motif — c'est le "type" qui structure le contenu, pas un ton au choix.
export const lettreAdminTypeSchema = z.enum([
  "demande-attestation",
  "demande-conge",
  "demission",
  "resiliation",
  "reclamation",
  "demande-rdv",
  "autre",
]);
export type LettreAdminType = z.infer<typeof lettreAdminTypeSchema>;

export const lettreAdminTypeLabels: Record<LettreAdminType, string> = {
  "demande-attestation": "Demande d'attestation",
  "demande-conge": "Demande de congé",
  demission: "Lettre de démission",
  resiliation: "Résiliation",
  reclamation: "Réclamation",
  "demande-rdv": "Demande de rendez-vous",
  autre: "Autre",
};

// Ce que l'utilisateur remplit. Comme pour la lettre de motivation et
// l'e-mail : rien n'est inventé par l'IA — "context" porte tous les faits,
// le reste ne fait qu'identifier l'expéditeur/le destinataire et dater/situer
// la lettre (mêmes helpers que letter.ts : formatFrenchDate/getCityOnly).
export const lettreAdminFormSchema = z.object({
  lettreType: lettreAdminTypeSchema,
  context: z
    .string()
    .min(20, "Décris la situation en au moins quelques mots")
    .max(3000, "Décris la situation en 3000 caractères maximum"),
  senderName: z.string().min(2, "Indique ton nom"),
  senderAddress: z.string().max(200).optional(),
  senderPhone: z.string().max(50).optional(),
  senderEmail: z.string().max(150).optional(),
  city: z.string().min(2, "Indique ta ville"),
  recipientName: z.string().min(2, "Indique le destinataire (personne ou service)"),
  recipientAddress: z.string().max(200).optional(),
});
export type LettreAdminFormValues = z.infer<typeof lettreAdminFormSchema>;

// Ce que l'IA doit renvoyer. "paragraphs" (et non un "body" unique, comme
// pour l'e-mail) délibérément, pour réutiliser tel quel
// getLetterDensityScale/isCompactLetter de src/lib/tools/letter-density.ts
// (typé structurellement sur { paragraphs: string[] }) pour le PDF et
// l'aperçu HTML.
export const lettreAdminContentSchema = z.object({
  subject: z.string(),
  greeting: z.string(),
  paragraphs: z.array(z.string().min(1)).min(2).max(6),
  closing: z.string(),
  signatureName: z.string(),
});
export type LettreAdminContent = z.infer<typeof lettreAdminContentSchema>;

export const lettreAdminResultDataSchema = z.object({
  form: lettreAdminFormSchema,
  content: lettreAdminContentSchema,
  createdAt: z.string(),
});
export type LettreAdminResultData = z.infer<typeof lettreAdminResultDataSchema>;

// Outil n°6 : Générateur de posts pour réseaux sociaux. Le réseau choisi
// change les conventions d'écriture (longueur, hashtags, ton) — c'est le
// seul levier de structure, comme le "type" pour la lettre administrative.
export const socialPlatformSchema = z.enum(["facebook", "instagram", "whatsapp", "linkedin"]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "Statut WhatsApp",
  linkedin: "LinkedIn",
};

// Ce que l'utilisateur remplit. "context" porte tous les faits (produit,
// promotion, actualité) — comme pour l'e-mail/la lettre administrative,
// rien n'est inventé par l'IA au-delà de ce qui est décrit ici.
export const socialPostFormSchema = z.object({
  platform: socialPlatformSchema,
  context: z
    .string()
    .min(20, "Décris ce que tu veux communiquer en au moins quelques mots")
    .max(2000, "Décris la situation en 2000 caractères maximum"),
  businessName: z.string().max(150).optional(),
  callToAction: z.string().max(200).optional(),
});
export type SocialPostFormValues = z.infer<typeof socialPostFormSchema>;

// Ce que l'IA doit renvoyer : exactement 3 variantes distinctes par
// génération (accroches différentes), chacune avec ses propres hashtags —
// pertinents uniquement sur les réseaux qui les utilisent réellement
// (WhatsApp Statut n'en a normalement aucun).
export const socialPostVariantSchema = z.object({
  text: z.string(),
  hashtags: z.array(z.string()).optional(),
});
export type SocialPostVariant = z.infer<typeof socialPostVariantSchema>;

export const socialPostContentSchema = z.object({
  variants: z.array(socialPostVariantSchema).length(3),
});
export type SocialPostContent = z.infer<typeof socialPostContentSchema>;

export const socialPostResultDataSchema = z.object({
  form: socialPostFormSchema,
  content: socialPostContentSchema,
  createdAt: z.string(),
});
export type SocialPostResultData = z.infer<typeof socialPostResultDataSchema>;

// Outil n°7 : Générateur de prompts IA. Le type de tâche change les bonnes
// pratiques à appliquer (rôle, contraintes, format) — même principe que la
// plateforme pour les posts réseaux sociaux ou le type pour la lettre
// administrative.
export const promptTaskTypeSchema = z.enum(["redaction", "code", "analyse", "image", "autre"]);
export type PromptTaskType = z.infer<typeof promptTaskTypeSchema>;

export const promptTaskTypeLabels: Record<PromptTaskType, string> = {
  redaction: "Rédaction",
  code: "Code",
  analyse: "Analyse",
  image: "Génération d'image",
  autre: "Autre",
};

// Ce que l'utilisateur remplit. "goal" porte l'objectif réel — l'IA ne fait
// que le structurer en prompt optimisé, elle n'invente jamais un objectif
// ou une contrainte non mentionnés.
export const promptIaFormSchema = z.object({
  taskType: promptTaskTypeSchema,
  goal: z
    .string()
    .min(20, "Décris ton objectif en au moins quelques mots")
    .max(2000, "Décris ton objectif en 2000 caractères maximum"),
  desiredFormat: z.string().max(200).optional(),
  constraints: z.string().max(200).optional(),
});
export type PromptIaFormValues = z.infer<typeof promptIaFormSchema>;

// Ce que l'IA doit renvoyer : exactement 3 versions distinctes du prompt
// optimisé (ex : concise / détaillée / avec exemples), chacune prête à être
// collée telle quelle dans un assistant IA.
export const promptIaVariantSchema = z.object({
  title: z.string(),
  prompt: z.string(),
});
export type PromptIaVariant = z.infer<typeof promptIaVariantSchema>;

export const promptIaContentSchema = z.object({
  variants: z.array(promptIaVariantSchema).length(3),
});
export type PromptIaContent = z.infer<typeof promptIaContentSchema>;

export const promptIaResultDataSchema = z.object({
  form: promptIaFormSchema,
  content: promptIaContentSchema,
  createdAt: z.string(),
});
export type PromptIaResultData = z.infer<typeof promptIaResultDataSchema>;

// Outil n°8 : Générateur de nom d'entreprise + slogan. Pas de type/plateforme
// ici — "activityDescription" est le seul levier de contenu, style et
// public visé restent facultatifs pour ne pas complexifier le formulaire.
export const businessNameFormSchema = z.object({
  activityDescription: z
    .string()
    .min(20, "Décris ton activité en au moins quelques mots")
    .max(1000, "Décris ton activité en 1000 caractères maximum"),
  style: z.string().max(200).optional(),
  targetAudience: z.string().max(200).optional(),
});
export type BusinessNameFormValues = z.infer<typeof businessNameFormSchema>;

// Ce que l'IA doit renvoyer : entre 5 et 6 propositions distinctes, chacune
// avec un nom, un slogan et une courte explication du choix.
export const businessNameSuggestionSchema = z.object({
  name: z.string(),
  slogan: z.string(),
  explanation: z.string(),
});
export type BusinessNameSuggestion = z.infer<typeof businessNameSuggestionSchema>;

export const businessNameContentSchema = z.object({
  suggestions: z.array(businessNameSuggestionSchema).min(5).max(6),
});
export type BusinessNameContent = z.infer<typeof businessNameContentSchema>;

export const businessNameResultDataSchema = z.object({
  form: businessNameFormSchema,
  content: businessNameContentSchema,
  createdAt: z.string(),
});
export type BusinessNameResultData = z.infer<typeof businessNameResultDataSchema>;

// Outil n°9 : Business plan / pitch. Contrairement aux 4 derniers outils
// (texte inline), le format de sortie est un PDF téléchargeable — même
// flavor que le CV/la lettre/la lettre administrative — car ce document est
// destiné à être présenté tel quel à une banque ou un investisseur.
// Sous-étape (a) uniquement : schémas + prompt + formulaire + génération +
// PDF. Le quota, l'historique et le partage sont ajoutés à la sous-étape
// (b) — voir src/server/tools/business-plan.ts.
export const businessPlanFormSchema = z.object({
  founderName: z.string().min(2, "Indique ton nom"),
  projectName: z.string().min(2, "Indique le nom du projet"),
  location: z.string().min(2, "Indique ta ville"),
  activityDescription: z
    .string()
    .min(30, "Décris ton projet en au moins quelques phrases")
    .max(2000, "Décris ton projet en 2000 caractères maximum"),
  targetMarketInfo: z.string().max(1000).optional(),
  businessModelInfo: z.string().max(1000).optional(),
  fundingAmount: z.string().max(300).optional(),
});
export type BusinessPlanFormValues = z.infer<typeof businessPlanFormSchema>;

// Ce que l'IA doit renvoyer : les 8 sections validées avec l'utilisateur.
export const businessPlanContentSchema = z.object({
  executiveSummary: z.string(),
  problem: z.string(),
  solution: z.string(),
  targetMarket: z.string(),
  businessModel: z.string(),
  competitiveAdvantage: z.string(),
  fundingNeed: z.string(),
  nextSteps: z.string(),
});
export type BusinessPlanContent = z.infer<typeof businessPlanContentSchema>;

export const businessPlanResultDataSchema = z.object({
  form: businessPlanFormSchema,
  content: businessPlanContentSchema,
  createdAt: z.string(),
});
export type BusinessPlanResultData = z.infer<typeof businessPlanResultDataSchema>;

// Outil n°10 : Résumé / reformulation de document. Le mode change la
// nature même de la transformation (condenser vs. reformuler à longueur
// équivalente) — c'est le seul levier structurel, comme le type pour la
// lettre administrative.
export const resumeModeSchema = z.enum(["resume-court", "resume-detaille", "reformulation"]);
export type ResumeMode = z.infer<typeof resumeModeSchema>;

export const resumeModeLabels: Record<ResumeMode, string> = {
  "resume-court": "Résumé court",
  "resume-detaille": "Résumé détaillé",
  reformulation: "Reformulation",
};

// "sourceText" est traité directement dans le formulaire (pas de fichier à
// uploader) — le texte à condenser ou reformuler est collé tel quel.
export const resumeDocumentFormSchema = z.object({
  mode: resumeModeSchema,
  sourceText: z
    .string()
    .min(50, "Colle un texte d'au moins quelques phrases")
    .max(10000, "Le texte doit faire 10 000 caractères maximum"),
});
export type ResumeDocumentFormValues = z.infer<typeof resumeDocumentFormSchema>;

// Ce que l'IA doit renvoyer : un seul résultat (pas de variantes) — un
// résumé ou une reformulation n'a pas plusieurs versions à choisir, à la
// différence d'un post ou d'un prompt.
export const resumeDocumentContentSchema = z.object({
  result: z.string(),
});
export type ResumeDocumentContent = z.infer<typeof resumeDocumentContentSchema>;

export const resumeDocumentResultDataSchema = z.object({
  form: resumeDocumentFormSchema,
  content: resumeDocumentContentSchema,
  createdAt: z.string(),
});
export type ResumeDocumentResultData = z.infer<typeof resumeDocumentResultDataSchema>;

// Outil n°11 : Script vidéo réseaux sociaux. Plateforme et durée sont deux
// leviers structurels distincts ici (contrairement aux outils précédents à
// un seul levier) : la plateforme influence surtout le ton, la durée
// influence directement le nombre et le rythme des séquences.
export const videoPlatformSchema = z.enum(["tiktok", "reels", "shorts"]);
export type VideoPlatform = z.infer<typeof videoPlatformSchema>;

export const videoPlatformLabels: Record<VideoPlatform, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
};

export const videoDurationSchema = z.enum(["15s", "30s", "60s"]);
export type VideoDuration = z.infer<typeof videoDurationSchema>;

export const videoDurationLabels: Record<VideoDuration, string> = {
  "15s": "15 secondes",
  "30s": "30 secondes",
  "60s": "60 secondes",
};

// "subject" porte tous les faits sur la vidéo (produit, message, offre) —
// rien n'est inventé par l'IA au-delà de ce qui est décrit ici.
export const videoScriptFormSchema = z.object({
  platform: videoPlatformSchema,
  duration: videoDurationSchema,
  subject: z
    .string()
    .min(20, "Décris le sujet de ta vidéo en au moins quelques mots")
    .max(2000, "Décris le sujet en 2000 caractères maximum"),
});
export type VideoScriptFormValues = z.infer<typeof videoScriptFormSchema>;

// Ce que l'IA doit renvoyer : le script découpé en séquences chronologiques,
// chacune avec son minutage, le texte à dire et l'indication visuelle.
export const videoScriptSequenceSchema = z.object({
  timing: z.string(),
  spokenText: z.string(),
  visualCue: z.string(),
});
export type VideoScriptSequence = z.infer<typeof videoScriptSequenceSchema>;

export const videoScriptContentSchema = z.object({
  sequences: z.array(videoScriptSequenceSchema).min(3).max(8),
});
export type VideoScriptContent = z.infer<typeof videoScriptContentSchema>;

export const videoScriptResultDataSchema = z.object({
  form: videoScriptFormSchema,
  content: videoScriptContentSchema,
  createdAt: z.string(),
});
export type VideoScriptResultData = z.infer<typeof videoScriptResultDataSchema>;

// Outil n°12 : Calcul prix de vente / marge. Contrairement aux 11 outils
// précédents, aucun appel IA — un calcul déterministe, comme
// computeFactureTotals() dans facture-calc.ts. Pas de ToolResult ni de
// partage/historique pour cet outil (validé explicitement) : seul un
// ToolRun est enregistré, uniquement pour le quota.
export const pricingCalcModeSchema = z.enum(["marge", "prix-cible"]);
export type PricingCalcMode = z.infer<typeof pricingCalcModeSchema>;

export const pricingCalcFormSchema = z
  .object({
    unitCost: z.number().min(0, "Le coût de revient doit être positif ou nul"),
    currency: factureCurrencySchema,
    calcMode: pricingCalcModeSchema,
    marginPercent: z.number().min(0, "La marge doit être positive ou nulle").optional(),
    targetPrice: z.number().min(0, "Le prix doit être positif ou nul").optional(),
    quantity: z.number().min(1, "La quantité doit être d'au moins 1").optional(),
  })
  .refine((data) => data.calcMode !== "marge" || data.marginPercent !== undefined, {
    message: "Indique la marge souhaitée",
    path: ["marginPercent"],
  })
  .refine((data) => data.calcMode !== "prix-cible" || data.targetPrice !== undefined, {
    message: "Indique le prix de vente à tester",
    path: ["targetPrice"],
  });
export type PricingCalcFormValues = z.infer<typeof pricingCalcFormSchema>;

// Le résultat calculé — jamais stocké, jamais renvoyé par une IA, toujours
// recalculé côté serveur à partir des mêmes entrées (voir pricing-calc.ts).
export type PricingCalcResult = {
  sellingPrice: number;
  marginAmount: number;
  marginPercent: number | null;
  totalProfit: number | null;
};

// Outil n°13 : Contrat simple (prestation, location). Périmètre
// volontairement restreint (validé explicitement) : 2 types de contrats
// génériques et basiques uniquement, jamais de clauses juridiques
// complexes. Un disclaimer juridique est imprimé systématiquement sur le
// PDF — de façon déterministe (jamais généré par l'IA), voir contrat-pdf.tsx.
export const contratTypeSchema = z.enum(["prestation-service", "location"]);
export type ContratType = z.infer<typeof contratTypeSchema>;

export const contratTypeLabels: Record<ContratType, string> = {
  "prestation-service": "Contrat de prestation de service",
  location: "Contrat de location",
};

// Les rôles des parties dépendent du type de contrat — déterminés de façon
// fixe ici (jamais par l'IA), pour rester juridiquement neutres et cohérents
// avec le vocabulaire du type de contrat choisi.
export const CONTRAT_PARTY_ROLES: Record<ContratType, { partyA: string; partyB: string }> = {
  "prestation-service": { partyA: "Le Prestataire", partyB: "Le Client" },
  location: { partyA: "Le Bailleur", partyB: "Le Locataire" },
};

export const contratFormSchema = z.object({
  contratType: contratTypeSchema,
  partyAName: z.string().min(2, "Indique le nom de la première partie"),
  partyAAddress: z.string().max(200).optional(),
  partyBName: z.string().min(2, "Indique le nom de la deuxième partie"),
  partyBAddress: z.string().max(200).optional(),
  objet: z
    .string()
    .min(20, "Décris l'objet du contrat en au moins quelques mots")
    .max(1500, "Décris l'objet du contrat en 1500 caractères maximum"),
  amount: z.number().min(0, "Le montant doit être positif ou nul"),
  currency: factureCurrencySchema,
  duration: z.string().min(2, "Indique la durée du contrat").max(200),
  city: z.string().min(2, "Indique la ville"),
});
export type ContratFormValues = z.infer<typeof contratFormSchema>;

// Ce que l'IA doit renvoyer : uniquement les clauses de base validées
// (Objet, Durée, Prix et modalités de paiement, Obligations, Résiliation) —
// jamais de clause juridique complexe non prévue par ce périmètre.
export const contratClauseSchema = z.object({
  title: z.string(),
  text: z.string(),
});
export type ContratClause = z.infer<typeof contratClauseSchema>;

export const contratContentSchema = z.object({
  preamble: z.string(),
  clauses: z.array(contratClauseSchema).min(3).max(6),
});
export type ContratContent = z.infer<typeof contratContentSchema>;

export const contratResultDataSchema = z.object({
  form: contratFormSchema,
  content: contratContentSchema,
  createdAt: z.string(),
});
export type ContratResultData = z.infer<typeof contratResultDataSchema>;

// Outil n°14 : Workflow n8n assisté par IA. Contrairement aux 13 outils
// précédents (texte libre), la sortie doit être un JSON structurellement
// valide — une imperfection ici n'est pas juste maladroite, elle empêche
// l'import du workflow dans n8n. Le schéma ci-dessous valide la structure
// (nœuds/connexions), pas le contenu détaillé de chaque "parameters" par
// type de nœud (hors de portée sans le système de types complet de n8n) —
// voir n8n-workflow-validate.ts pour la vérification d'intégrité
// supplémentaire (les connexions référencent des nœuds qui existent).
export const n8nTriggerTypeSchema = z.enum(["webhook", "schedule", "manual"]);
export type N8nTriggerType = z.infer<typeof n8nTriggerTypeSchema>;

export const n8nTriggerTypeLabels: Record<N8nTriggerType, string> = {
  webhook: "Webhook (déclenché par une requête HTTP)",
  schedule: "Planifié (à intervalle régulier)",
  manual: "Manuel (déclenché à la demande)",
};

export const n8nWorkflowFormSchema = z.object({
  triggerType: n8nTriggerTypeSchema,
  description: z
    .string()
    .min(20, "Décris ton besoin d'automatisation en au moins quelques mots")
    .max(1500, "Décris ton besoin en 1500 caractères maximum"),
});
export type N8nWorkflowFormValues = z.infer<typeof n8nWorkflowFormSchema>;

export const n8nNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number(),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.string(), z.any()),
});
export type N8nNode = z.infer<typeof n8nNodeSchema>;

const n8nConnectionRefSchema = z.object({
  node: z.string(),
  type: z.literal("main"),
  index: z.number(),
});

export const n8nWorkflowJsonSchema = z.object({
  name: z.string(),
  nodes: z.array(n8nNodeSchema).min(2).max(6),
  connections: z.record(z.string(), z.array(z.array(n8nConnectionRefSchema))),
});
export type N8nWorkflowJson = z.infer<typeof n8nWorkflowJsonSchema>;

export const n8nGenerationContentSchema = z.object({
  workflow: n8nWorkflowJsonSchema,
  explanation: z.string(),
});
export type N8nGenerationContent = z.infer<typeof n8nGenerationContentSchema>;

export const n8nResultDataSchema = z.object({
  form: n8nWorkflowFormSchema,
  content: n8nGenerationContentSchema,
  createdAt: z.string(),
});
export type N8nResultData = z.infer<typeof n8nResultDataSchema>;
