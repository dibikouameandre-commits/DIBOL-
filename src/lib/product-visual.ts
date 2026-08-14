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

const visualsBySlug: Record<string, Visual> = {
  "automatisation-n8n": {
    gradient: "from-[oklch(0.55_0.2_277)] to-[oklch(0.62_0.19_255)]",
    icon: Workflow,
  },
  "prompts-ia": {
    gradient: "from-[oklch(0.6_0.2_300)] to-[oklch(0.55_0.22_277)]",
    icon: Sparkles,
  },
  "formations-ia": {
    gradient: "from-[oklch(0.62_0.19_255)] to-[oklch(0.65_0.15_220)]",
    icon: GraduationCap,
  },
  "templates-workflows": {
    gradient: "from-[oklch(0.6_0.18_320)] to-[oklch(0.55_0.2_277)]",
    icon: LayoutTemplate,
  },
};

const fallbackVisual: Visual = {
  gradient: "from-[oklch(0.55_0.2_277)] to-[oklch(0.6_0.18_320)]",
  icon: Package,
};

export function getCategoryVisual(slug: string): Visual {
  return visualsBySlug[slug] ?? fallbackVisual;
}
