import type { CvContent, TemplateId } from "@/lib/validations/tools";

// Estimates how many "lines" of content a CV actually has, purely from its
// structure — no rendering involved. This is what lets the layout breathe
// more on a sparse CV (a student with one line of experience) and tighten
// up on a dense one (someone with 3+ jobs and many bullets), without ever
// touching the content itself.
function estimateContentLines(cv: CvContent): number {
  let lines = 3; // name + role + contact row

  if (cv.summary) {
    lines += 1 + Math.ceil(cv.summary.length / 85);
  }

  if (cv.experiences.length > 0) {
    lines += 1; // section heading
    for (const exp of cv.experiences) {
      lines += 1 + exp.bullets.length; // title/company/period line + bullets
    }
  }

  if (cv.education.length > 0) {
    lines += 1 + cv.education.length;
  }

  if (cv.skills.length > 0) {
    lines += 1 + Math.ceil(cv.skills.length / 3);
  }

  if (cv.languages && cv.languages.length > 0) {
    lines += 2;
  }

  return lines;
}

export type ContentDensity = "sparse" | "medium" | "dense";

export function computeCvDensity(cv: CvContent): ContentDensity {
  const lines = estimateContentLines(cv);
  if (lines <= 20) return "sparse";
  if (lines <= 29) return "medium";
  return "dense";
}

// Multipliers/deltas applied on top of each template's own baseline values
// (its "medium" look, already tuned) — never absolute numbers, so every
// template keeps its own distinct identity at every density level.
export type DensityScale = {
  sectionGapMultiplier: number;
  pagePaddingDelta: number;
  bodyFontDelta: number;
  // A header photo has a fixed footprint that section-gap/padding/font
  // scaling doesn't touch — on a dense CV that's already tight, the photo
  // alone can be the difference that spills a near-empty extra page.
  // Scaling it down slightly (proportionally, same as everything else)
  // reclaims just enough room without needing this on sparse/medium.
  photoSizeMultiplier: number;
};

const SCALES: Record<ContentDensity, DensityScale> = {
  sparse: { sectionGapMultiplier: 1.7, pagePaddingDelta: 14, bodyFontDelta: 0.6, photoSizeMultiplier: 1 },
  medium: { sectionGapMultiplier: 1, pagePaddingDelta: 0, bodyFontDelta: 0, photoSizeMultiplier: 1 },
  dense: { sectionGapMultiplier: 0.75, pagePaddingDelta: -6, bodyFontDelta: -0.4, photoSizeMultiplier: 0.8 },
};

// Le modèle Étudiant est explicitement optimisé pour les profils courts
// (voir cv-templates/etudiant.tsx) — un peu plus d'air que les autres
// quand le contenu est sparse, toujours proportionnel à sa propre base.
const ETUDIANT_SPARSE_SCALE: DensityScale = {
  sectionGapMultiplier: 2.1,
  pagePaddingDelta: 20,
  bodyFontDelta: 0.8,
  photoSizeMultiplier: 1,
};

export function getDensityScale(templateId: TemplateId, density: ContentDensity): DensityScale {
  if (templateId === "etudiant" && density === "sparse") {
    return ETUDIANT_SPARSE_SCALE;
  }
  return SCALES[density];
}
