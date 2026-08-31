// Shared by every tool's content-quality gate (cv-quality.ts,
// letter-quality.ts, ...) — a single implementation of "how similar are
// these two texts" so it's tuned once, not once per tool.

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function wordSet(text: string): Set<string> {
  return new Set(normalize(text).split(/\s+/).filter(Boolean));
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}
