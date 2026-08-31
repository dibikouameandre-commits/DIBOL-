"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BusinessNameContent } from "@/lib/validations/tools";

// Une carte sobre par proposition, pas un document PDF : le résultat de
// cet outil est fait pour être copié, pas téléchargé — même principe que
// SocialPostPreview/PromptIaPreview.
export function BusinessNamePreview({ content }: { content: BusinessNameContent }) {
  return (
    <div className="flex flex-col gap-4">
      {content.suggestions.map((suggestion, i) => (
        <SuggestionCard key={i} suggestion={suggestion} />
      ))}
    </div>
  );
}

function SuggestionCard({
  suggestion,
}: {
  suggestion: BusinessNameContent["suggestions"][number];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${suggestion.name} — ${suggestion.slogan}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-3">
        <p className="font-semibold">{suggestion.name}</p>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      <div className="flex flex-col gap-2 px-5 py-5 text-sm leading-relaxed">
        <p className="font-medium italic">{suggestion.slogan}</p>
        <p className="text-neutral-500">{suggestion.explanation}</p>
      </div>
    </div>
  );
}
