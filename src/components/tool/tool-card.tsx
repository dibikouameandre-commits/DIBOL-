import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolDefinition } from "@/lib/tools/registry";
import { getToolCategoryColor, getToolCategoryGradient } from "@/lib/tools/tool-visual";

// Same hover/elevation language as ProductCard (src/components/product/product-card.tsx)
// so the tools — the product's actual core usage — read at least as polished
// as the shop, not as a plainer, secondary section of the site.
export function ToolCard({
  tool,
  available,
}: {
  tool: ToolDefinition;
  available: boolean;
}) {
  const Icon = tool.icon;
  const color = getToolCategoryColor(tool.category);
  const gradient = getToolCategoryGradient(tool.category);

  const card = (
    <Card
      className={cn(
        "h-full gap-0 overflow-hidden rounded-2xl py-0 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 ease-out",
        available && "group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-primary/40",
        !available && "opacity-60"
      )}
    >
      <div
        className={cn(
          "relative flex h-20 items-center justify-center overflow-hidden bg-gradient-to-br",
          gradient
        )}
      >
        <div className="absolute inset-0 bg-grid-fade opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.18),transparent_65%)]" />
        <div
          className={cn(
            "relative flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-transform duration-300 ease-out",
            available && "group-hover:scale-110"
          )}
        >
          <Icon className="size-5 text-white" strokeWidth={1.75} />
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-5">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "w-fit border-0",
              // Light mode: unchanged from before (~10% of the category
              // color as a fill, the category color itself as text) — just
              // expressed in CSS instead of a JS-computed inline hex string,
              // so the dark: override below can actually take effect (an
              // inline `style` color/backgroundColor would otherwise always
              // win over any className, dark or not). Marked `!important`
              // since the `secondary` variant's own bg-secondary/
              // text-secondary-foreground utilities aren't recognized by
              // tailwind-merge as conflicting with these arbitrary
              // properties, so both would otherwise ship and the variant's
              // flat gray would win by source order.
              "[background-color:color-mix(in_oklch,var(--badge-color),transparent_90%)]!",
              "[color:var(--badge-color)]!",
              // Dark mode: the raw category color (designed against a white
              // card) was failing contrast on the dark card background
              // (~1.86:1, WCAG needs 4.5:1). Forcing the text to a fixed
              // high lightness via OKLCH relative syntax — keeping the
              // category's own hue/chroma — fixes that without needing a
              // second, hand-picked color per category.
              "dark:[background-color:color-mix(in_oklch,var(--badge-color),transparent_85%)]!",
              "dark:[color:oklch(from_var(--badge-color)_0.82_c_h)]!"
            )}
            style={{ "--badge-color": color } as React.CSSProperties}
          >
            {tool.category}
          </Badge>
          {!available && <Badge variant="outline">Bientôt</Badge>}
        </div>
        <h3 className="line-clamp-2 font-heading font-semibold tracking-tight">
          {tool.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
        {available && (
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Essayer gratuitement
            <ArrowRight className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  return available ? (
    <Link href={`/outils/${tool.slug}`} className="group block h-full">
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}
