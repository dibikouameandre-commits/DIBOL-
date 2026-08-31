"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmailContent } from "@/lib/validations/tools";
import { formatEmailAsText } from "@/lib/tools/email-format";

export function CopyEmailButton({ content }: { content: EmailContent }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatEmailAsText(content));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le texte reste visible et copiable manuellement.
    }
  };

  return (
    <Button type="button" size="lg" onClick={handleCopy} className="gap-2">
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copié !" : "Copier l'e-mail"}
    </Button>
  );
}
