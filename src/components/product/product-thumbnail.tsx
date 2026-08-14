import { cn } from "@/lib/utils";
import { getCategoryVisual } from "@/lib/product-visual";

export function ProductThumbnail({
  categorySlug,
  className,
  iconClassName,
}: {
  categorySlug: string;
  className?: string;
  iconClassName?: string;
}) {
  const { gradient, icon: Icon } = getCategoryVisual(categorySlug);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
    >
      <div className="absolute inset-0 bg-grid-fade opacity-20" />
      <Icon
        className={cn("relative size-10 text-white/90", iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}
