// One gradient per category (not per tool) so the 14 cards read as a
// small number of families rather than 14 unrelated colors — same
// principle as getCategoryVisual() for shop products (src/lib/product-visual.ts).
//
// Values live once in src/app/globals.css (--tool-*-from/--tool-*-to) and
// are referenced here via CSS variables so the color itself has a single
// source of truth; only the Tailwind arbitrary-value class names stay here,
// since that's what the gradient's consumer (ToolCard) actually needs.
const gradientByCategory: Record<string, string> = {
  Emploi: "from-[var(--tool-emploi-from)] to-[var(--tool-emploi-to)]",
  Gestion: "from-[var(--tool-gestion-from)] to-[var(--tool-gestion-to)]",
  Marketing: "from-[var(--tool-marketing-from)] to-[var(--tool-marketing-to)]",
  Productivité: "from-[var(--tool-productivite-from)] to-[var(--tool-productivite-to)]",
  Entrepreneuriat: "from-[var(--tool-entrepreneuriat-from)] to-[var(--tool-entrepreneuriat-to)]",
};

const fallbackGradient = "from-[var(--tool-fallback-from)] to-[var(--tool-fallback-to)]";

export function getToolCategoryGradient(category: string): string {
  return gradientByCategory[category] ?? fallbackGradient;
}

// First stop of each category's gradient, reused as the solid badge color
// so the badge always matches the card's own vignette. ToolCard consumes
// this as a literal hex string (`${color}1A` — appending a hex alpha
// suffix for the badge background), so unlike the gradient above this
// can't be a CSS var() reference; kept as the same literal values as
// --tool-*-from in globals.css, which is the actual source of truth for
// the gradient's matching first stop.
const colorByCategory: Record<string, string> = {
  Emploi: "#4338CA",
  Gestion: "#0F766E",
  Marketing: "#EA4335",
  Productivité: "#2563EB",
  Entrepreneuriat: "#7C3AED",
};

const fallbackColor = "#4338CA";

export function getToolCategoryColor(category: string): string {
  return colorByCategory[category] ?? fallbackColor;
}
