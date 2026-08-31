"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VideoScriptContent } from "@/lib/validations/tools";
import { formatVideoScriptAsText } from "@/lib/tools/video-script-format";

// Une seule carte pour tout le script (pas une par séquence) — les
// séquences forment un tout chronologique, avec un seul bouton "Copier"
// pour l'ensemble du script.
export function VideoScriptPreview({ content }: { content: VideoScriptContent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatVideoScriptAsText(content));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
      <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-3">
        <p className="text-xs font-medium text-neutral-500">Script complet</p>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié !" : "Copier le script"}
        </Button>
      </div>
      <div className="flex flex-col divide-y">
        {content.sequences.map((seq, i) => (
          <div key={i} className="flex flex-col gap-1.5 px-5 py-4">
            <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {seq.timing}
            </span>
            <p className="text-sm leading-relaxed">
              <span className="font-medium">À dire : </span>
              {seq.spokenText}
            </p>
            <p className="text-sm leading-relaxed text-neutral-500">
              <span className="font-medium text-neutral-600">À l&apos;écran : </span>
              {seq.visualCue}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
