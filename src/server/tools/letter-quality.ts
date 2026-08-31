import type { LetterContent } from "@/lib/validations/tools";
import { wordSet, jaccardSimilarity } from "@/server/tools/text-similarity";

// Same philosophy as cv-quality.ts: cheap, deterministic checks on the
// model's own output, not just prompt wording. Two failure modes are
// specific to a cover letter rather than a CV: a leftover template
// placeholder ("[nom de l'entreprise]") the model forgot to fill in with
// the real value it was given, and paragraphs that repeat the same idea.

const SIMILARITY_THRESHOLD = 0.75;
const PLACEHOLDER_PATTERN = /\[[^\]]{1,80}\]/;
const MIN_PARAGRAPH_LENGTH = 15;

export type LetterQualityIssue =
  | { type: "placeholder_left"; paragraph: string; match: string }
  | { type: "repeated_paragraph"; paragraphA: string; paragraphB: string }
  | { type: "empty_paragraph"; index: number };

export function checkLetterContentQuality(content: LetterContent): LetterQualityIssue[] {
  const issues: LetterQualityIssue[] = [];

  content.paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim().length < MIN_PARAGRAPH_LENGTH) {
      issues.push({ type: "empty_paragraph", index });
    }
    const match = paragraph.match(PLACEHOLDER_PATTERN);
    if (match) {
      issues.push({ type: "placeholder_left", paragraph, match: match[0] });
    }
  });

  for (let i = 0; i < content.paragraphs.length; i++) {
    for (let j = i + 1; j < content.paragraphs.length; j++) {
      const a = content.paragraphs[i];
      const b = content.paragraphs[j];
      if (jaccardSimilarity(wordSet(a), wordSet(b)) >= SIMILARITY_THRESHOLD) {
        issues.push({ type: "repeated_paragraph", paragraphA: a, paragraphB: b });
      }
    }
  }

  return issues;
}

export function buildCorrectiveNote(issues: LetterQualityIssue[]): string {
  const lines = issues.slice(0, 3).map((issue) => {
    if (issue.type === "placeholder_left") {
      return `- Ce paragraphe contient un texte non rempli, "${issue.match}", au lieu de la vraie information : "${issue.paragraph}". Remplace-le par les informations réelles fournies.`;
    }
    if (issue.type === "repeated_paragraph") {
      return `- Ces deux paragraphes disent la même chose : "${issue.paragraphA}" et "${issue.paragraphB}". Différencie-les ou fusionne-les.`;
    }
    return `- Le paragraphe ${issue.index + 1} est vide ou trop court. Développe-le à partir du parcours fourni.`;
  });

  return `---
ATTENTION : ta précédente tentative avait des problèmes à corriger :
${lines.join("\n")}
Corrige uniquement ces points. Respecte toujours les mêmes règles (rien d'inventé, aucun texte entre crochets, JSON valide selon le même schéma).`;
}
