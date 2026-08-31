"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ResumeDocumentContent } from "@/lib/validations/tools";

// Une seule carte (pas de variantes, contrairement aux posts/prompts) —
// un résumé ou une reformulation n'a qu'un seul résultat par génération.
export function ResumeDocumentPreview({ content }: { content: ResumeDocumentContent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-3">
        <p className="text-xs font-medium text-neutral-500">Résultat</p>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </Button>
      </div>
      <div className="px-5 py-5 text-sm leading-relaxed">
        <p className="whitespace-pre-line">{content.result}</p>
      </div>
    </div>
  );
}
