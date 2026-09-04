import {
  GraduationCap,
  LayoutTemplate,
  Package,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

type Visual = {
  gradient: string;
  icon: LucideIcon;
};

// Values live once in src/app/globals.css (--shop-*-from/--shop-*-to) and
// are referenced here via CSS variables — same principle as
// src/lib/tools/tool-visual.ts.
const visualsBySlug: Record<string, Visual> = {
  "automatisation-n8n": {
    gradient: "from-[var(--shop-n8n-from)] to-[var(--shop-n8n-to)]",
    icon: Workflow,
  },
  "prompts-ia": {
    gradient: "from-[var(--shop-prompts-from)] to-[var(--shop-prompts-to)]",
    icon: Sparkles,
  },
  "formations-ia": {
    gradient: "from-[var(--shop-formations-from)] to-[var(--shop-formations-to)]",
    icon: GraduationCap,
  },
  "templates-workflows": {
    gradient: "from-[var(--shop-templates-from)] to-[var(--shop-templates-to)]",
    icon: LayoutTemplate,
  },
};

const fallbackVisual: Visual = {
  gradient: "from-[var(--shop-fallback-from)] to-[var(--shop-fallback-to)]",
  icon: Package,
};

export function getCategoryVisual(slug: string): Visual {
  return visualsBySlug[slug] ?? fallbackVisual;
}
