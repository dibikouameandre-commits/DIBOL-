"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PromptIaContent } from "@/lib/validations/tools";

// Une carte sobre par variante, pas un document PDF : le résultat de cet
// outil est fait pour être copié dans un assistant IA, pas téléchargé —
// même principe que SocialPostPreview.
export function PromptIaPreview({ content }: { content: PromptIaContent }) {
  return (
    <div className="flex flex-col gap-4">
      {content.variants.map((variant, i) => (
        <VariantCard key={i} variant={variant} />
      ))}
    </div>
  );
}

function VariantCard({ variant }: { variant: PromptIaContent["variants"][number] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variant.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-3">
        <p className="text-xs font-medium text-neutral-500">{variant.title}</p>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      <div className="px-5 py-5 text-sm leading-relaxed">
        <p className="whitespace-pre-line">{variant.prompt}</p>
      </div>
    </div>
  );
}
