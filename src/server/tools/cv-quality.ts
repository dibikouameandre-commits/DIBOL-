import type { CvContent } from "@/lib/validations/tools";
import { normalize, wordSet, jaccardSimilarity } from "@/server/tools/text-similarity";

// Cheap, deterministic checks run on the model's own output — this is the
// actual safeguard against repetitive/generic content, not just prompt
// wording. Works the same regardless of which model is behind AI_MODEL
// (src/lib/openai.ts), so swapping models later doesn't require touching
// this file.

// Two bullets at or above this word-overlap ratio are treated as "the same
// point repeated" rather than two genuinely different achievements.
const SIMILARITY_THRESHOLD = 0.75;

export type QualityIssue =
  | { type: "repeated_bullets"; bulletA: string; bulletB: string }
  | { type: "duplicate_skill"; name: string };

export function checkCvContentQuality(cv: CvContent): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Flag bullets repeated (near-identically) across DIFFERENT experiences —
  // this is the exact failure mode reported: the same "gérer une équipe..."
  // style point copy-pasted across every job.
  const bulletsByExperience = cv.experiences.map((exp) => exp.bullets);
  for (let i = 0; i < bulletsByExperience.length; i++) {
    for (let j = i + 1; j < bulletsByExperience.length; j++) {
      for (const bulletA of bulletsByExperience[i]) {
        for (const bulletB of bulletsByExperience[j]) {
          if (jaccardSimilarity(wordSet(bulletA), wordSet(bulletB)) >= SIMILARITY_THRESHOLD) {
            issues.push({ type: "repeated_bullets", bulletA, bulletB });
          }
        }
      }
    }
  }

  const seenSkills = new Set<string>();
  for (const skill of cv.skills) {
    const key = normalize(skill.name);
    if (seenSkills.has(key)) {
      issues.push({ type: "duplicate_skill", name: skill.name });
    }
    seenSkills.add(key);
  }

  return issues;
}

// The corrective instruction appended to a retry — cites the actual
// duplicated text so the model can see exactly what to fix, rather than a
// vague "do better".
export function buildCorrectiveNote(issues: QualityIssue[]): string {
  const lines = issues.slice(0, 3).map((issue) =>
    issue.type === "repeated_bullets"
      ? `- Ces deux points sont trop proches l'un de l'autre : "${issue.bulletA}" et "${issue.bulletB}". Reformule-les pour qu'ils décrivent des aspects réellement différents de ces expériences, sans rien inventer de nouveau.`
      : `- La compétence "${issue.name}" apparaît plusieurs fois. Ne la liste qu'une seule fois.`
  );

  return `---
ATTENTION : ta précédente tentative avait des problèmes de qualité à corriger :
${lines.join("\n")}
Corrige uniquement ces points. Respecte toujours les mêmes règles (rien d'inventé, JSON valide selon le même schéma).`;
}
