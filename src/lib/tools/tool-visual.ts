// One gradient per category (not per tool) so the 14 cards read as a
// small number of families rather than 14 unrelated colors — same
// principle as getCategoryVisual() for shop products (src/lib/product-visual.ts).
const gradientByCategory: Record<string, string> = {
  Emploi: "from-[#4338CA] to-[#6366F1]",
  Gestion: "from-[#0F766E] to-[#14B8A6]",
  Marketing: "from-[#EA4335] to-[#F8BF24]",
  Productivité: "from-[#2563EB] to-[#38BDF8]",
  Entrepreneuriat: "from-[#7C3AED] to-[#A78BFA]",
};

const fallbackGradient = "from-[#4338CA] to-[#7C3AED]";

export function getToolCategoryGradient(category: string): string {
  return gradientByCategory[category] ?? fallbackGradient;
}

// First stop of each category's gradient, reused as the solid badge
// color so the badge always matches the card's own vignette.
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
