import type { LetterResultData } from "@/lib/validations/tools";

// The "Détaillée" length option can produce enough text to push the sign-off
// onto a near-empty second page — confirmed empirically: a 4-paragraph/
// 1085-char letter fit fine, a 5-paragraph/1890-char one spilled
// "Cordialement," from the name. A single threshold (not the CV tool's
// multi-tier density system — a letter only ever has one body of text to
// fit) scales padding/font/line-height down slightly for longer content.
// Shared by all 5 PDF templates and their HTML twins so every template
// handles a long letter the same way.
const COMPACT_THRESHOLD_CHARS = 1500;

export type LetterDensityScale = {
  padding: number;
  fontSize: number;
  lineHeight: number;
  paragraphGap: number;
};

export function isCompactLetter(letter: Pick<LetterResultData, "paragraphs">): boolean {
  return letter.paragraphs.reduce((sum, p) => sum + p.length, 0) > COMPACT_THRESHOLD_CHARS;
}

// basePadding/baseFontSize/baseLineHeight/baseParagraphGap are each
// template's own baseline (its normal, non-compact look) — this always
// scales down proportionally from that baseline, never to an absolute
// value, so every template keeps its own distinct identity when compact.
export function getLetterDensityScale(
  letter: Pick<LetterResultData, "paragraphs">,
  base: LetterDensityScale
): LetterDensityScale {
  if (!isCompactLetter(letter)) return base;

  return {
    padding: base.padding - 10,
    fontSize: Math.round((base.fontSize - 0.8) * 10) / 10,
    lineHeight: Math.round((base.lineHeight - 0.1) * 100) / 100,
    paragraphGap: base.paragraphGap - 4,
  };
}
