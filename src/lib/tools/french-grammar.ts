// Used to compose the letter's "Objet" line correctly regardless of what
// role name the person typed ("Assistante Comptable" needs "d'", "Comptable"
// needs "de ") — shared by the PDF template and its HTML twin so the elision
// rule is defined once.
const VOWEL_OR_MUTE_H = /^[aeiouyàâäéèêëîïôöùûüh]/i;

export function elideDe(word: string): string {
  return VOWEL_OR_MUTE_H.test(word) ? `d'${word}` : `de ${word}`;
}
