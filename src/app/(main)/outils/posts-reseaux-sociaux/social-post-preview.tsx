"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SocialPostContent } from "@/lib/validations/tools";
import { formatSocialPostVariantAsText } from "@/lib/tools/social-post-format";

// Une carte sobre par variante, pas un document PDF : le résultat de cet
// outil est fait pour être copié dans l'app du réseau visé, pas téléchargé
// — même principe que EmailPreview.
export function SocialPostPreview({ content }: { content: SocialPostContent }) {
  return (
    <div className="flex flex-col gap-4">
      {content.variants.map((variant, i) => (
        <VariantCard key={i} index={i} variant={variant} />
      ))}
    </div>
  );
}

function VariantCard({
  index,
  variant,
}: {
  index: number;
  variant: SocialPostContent["variants"][number];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatSocialPostVariantAsText(variant));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-3">
        <p className="text-xs font-medium text-neutral-500">Variante {index + 1}</p>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      <div className="flex flex-col gap-3 px-5 py-5 text-sm leading-relaxed">
        <p className="whitespace-pre-line">{variant.text}</p>
        {variant.hashtags && variant.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variant.hashtags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
