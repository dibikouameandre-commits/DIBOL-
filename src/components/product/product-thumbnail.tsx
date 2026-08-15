import { cn } from "@/lib/utils";
import { getCategoryVisual } from "@/lib/product-visual";

export function ProductThumbnail({
  categorySlug,
  className,
  iconClassName,
  iconWrapperClassName,
}: {
  categorySlug: string;
  className?: string;
  iconClassName?: string;
  iconWrapperClassName?: string;
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
      <div
        className={cn(
          "relative flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm transition-transform duration-300 ease-out group-hover:scale-110",
          iconWrapperClassName
        )}
      >
        <Icon
          className={cn("size-8 text-white", iconClassName)}
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}
