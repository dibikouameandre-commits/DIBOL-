import type { SkillLevel } from "@/lib/validations/tools";

// How full a skill's level bar renders, in both the PDF and HTML twins —
// shared so the two never disagree on what "avancé" looks like.
export const SKILL_LEVEL_RATIO: Record<SkillLevel, number> = {
  notion: 0.35,
  intermediaire: 0.6,
  avance: 0.8,
  expert: 1,
};
