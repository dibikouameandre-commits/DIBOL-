"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { N8nGenerationContent } from "@/lib/validations/tools";

// Pas de PDF pour cet outil (validé explicitement) — le livrable est le
// fichier .json lui-même, prêt à importer dans n8n. Le téléchargement se
// fait entièrement côté client via un Blob, sans route serveur dédiée ni
// nouvelle dépendance.
export function N8nWorkflowPreview({ content }: { content: N8nGenerationContent }) {
  const [copied, setCopied] = useState(false);
  const workflowJson = JSON.stringify(content.workflow, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workflowJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencieux — le JSON reste visible et copiable manuellement.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([workflowJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.workflow.name.replace(/[^a-zA-Z0-9-_]+/g, "-") || "workflow"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Ce que fait ce workflow</p>
        <p className="text-sm leading-relaxed">{content.explanation}</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white text-neutral-900">
        <div className="flex flex-col gap-2 border-b bg-neutral-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-neutral-500">
            {content.workflow.name} — fichier .json
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copié !" : "Copier"}
            </Button>
            <Button type="button" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="size-3.5" />
              Télécharger le .json
            </Button>
          </div>
        </div>
        <pre className="max-h-96 overflow-auto px-5 py-4 font-mono text-xs leading-relaxed">
          {workflowJson}
        </pre>
      </div>

      <p className="text-xs text-muted-foreground">
        Importe ce fichier dans n8n via « Importer depuis un fichier » sur ton instance.
      </p>
    </div>
  );
}
