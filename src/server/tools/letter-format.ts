import type { LetterResultData } from "@/lib/validations/tools";
import { elideDe } from "@/lib/tools/french-grammar";

// Shared by every letter template (PDF + HTML twins) so the header/date/
// salutation/subject composition logic — all deterministic, never
// AI-generated — is defined exactly once regardless of visual template.

export function formatFrenchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getCityOnly(location: string): string {
  return location.split(",")[0]?.trim() || location;
}

// hiringManagerName is expected to already carry its own honorific
// ("Mme Sanou") per the form's placeholder — prefixing the generic
// "Madame, Monsieur" in front of it produced grammatically broken
// salutations like "Madame, Monsieur Mme Sanou,".
export function getSalutation(letter: Pick<LetterResultData, "hiringManagerName">): string {
  return letter.hiringManagerName ? `${letter.hiringManagerName},` : "Madame, Monsieur,";
}

export function getSubjectLine(letter: Pick<LetterResultData, "targetRole">): string {
  return `Candidature au poste ${elideDe(letter.targetRole)}`;
}
