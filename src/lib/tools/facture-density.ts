import type { FactureResultData } from "@/lib/validations/tools";

// Estimates how many "lines" of content a facture/devis actually takes up,
// purely from its structure — no rendering involved. This is what lets the
// layout breathe more on a short 1-2 line invoice and tighten up on a long
// one (many articles, long descriptions, long notes), without ever changing
// the content or the calculated amounts. Mirrors src/lib/tools/cv-density.ts
// and src/lib/tools/letter-density.ts, adapted to a line-item table instead
// of prose.
function estimateContentLines(data: FactureResultData): number {
  const { form, totals } = data;
  let lines = 7; // en-tête entreprise + bloc doc + bloc client (estimation fixe)

  for (const line of totals.lines) {
    lines += 1 + Math.floor(line.description.length / 42);
  }

  if (form.issuerAddress) lines += Math.ceil(form.issuerAddress.length / 45);
  if (form.clientAddress) lines += Math.ceil(form.clientAddress.length / 45);
  if (form.paymentTerms) lines += 1 + Math.ceil(form.paymentTerms.length / 45);
  if (form.notes) lines += 1 + Math.ceil(form.notes.length / 45);

  return lines;
}

export type FactureDensity = "sparse" | "medium" | "dense";

export function computeFactureDensity(data: FactureResultData): FactureDensity {
  const lines = estimateContentLines(data);
  if (lines <= 15) return "sparse";
  if (lines <= 24) return "medium";
  return "dense";
}

// Multipliers/deltas applied on top of each template's own baseline values
// (its "medium" look, already tuned) — never absolute numbers, so every
// template keeps its own distinct identity at every density level.
export type FactureDensityScale = {
  sectionGapMultiplier: number;
  pagePaddingDelta: number;
  bodyFontDelta: number;
  rowPaddingMultiplier: number;
};

const SCALES: Record<FactureDensity, FactureDensityScale> = {
  sparse: { sectionGapMultiplier: 1.4, pagePaddingDelta: 8, bodyFontDelta: 0.4, rowPaddingMultiplier: 1.25 },
  medium: { sectionGapMultiplier: 1, pagePaddingDelta: 0, bodyFontDelta: 0, rowPaddingMultiplier: 1 },
  dense: { sectionGapMultiplier: 0.7, pagePaddingDelta: -8, bodyFontDelta: -0.4, rowPaddingMultiplier: 0.75 },
};

export function getFactureDensityScale(density: FactureDensity): FactureDensityScale {
  return SCALES[density];
}
