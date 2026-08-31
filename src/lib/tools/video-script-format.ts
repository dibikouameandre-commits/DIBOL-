import type { VideoScriptContent } from "@/lib/validations/tools";

// Assemble le script complet en texte brut prêt à coller dans un outil de
// tournage/montage — un seul bouton "Copier" pour tout le script, pas un
// par séquence, car les séquences forment un tout chronologique indivisible.
export function formatVideoScriptAsText(content: VideoScriptContent): string {
  return content.sequences
    .map((seq) => `[${seq.timing}]\nTexte : ${seq.spokenText}\nVisuel : ${seq.visualCue}`)
    .join("\n\n");
}
