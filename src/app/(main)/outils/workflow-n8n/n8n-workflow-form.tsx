"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { MessageCircle, Copy } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { cn } from "@/lib/utils";
import type { ToolQuotaStatus } from "@/lib/rate-limit";
import {
  n8nWorkflowFormSchema,
  n8nTriggerTypeLabels,
  type N8nWorkflowFormValues,
  type N8nGenerationContent,
} from "@/lib/validations/tools";
import { generateN8nWorkflow } from "@/server/tools/n8n-workflow";
import { N8nWorkflowPreview } from "./n8n-workflow-preview";

export function N8nWorkflowForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<N8nGenerationContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<N8nWorkflowFormValues>({
    resolver: zodResolver(n8nWorkflowFormSchema),
    defaultValues: { triggerType: "manual" },
  });

  const onSubmit = async (values: N8nWorkflowFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateN8nWorkflow(values);
    setIsSubmitting(false);

    if (result.quota) {
      setQuota(result.quota);
    }

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContent(result.content);
    setShareSlug(result.shareSlug);
    toast.success("Workflow généré.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="triggerType">Déclencheur souhaité</Label>
        <Controller
          name="triggerType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="triggerType" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) =>
                    n8nTriggerTypeLabels[value as keyof typeof n8nTriggerTypeLabels]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(n8nTriggerTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.triggerType && (
          <p className="text-sm text-destructive">{errors.triggerType.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Décris ton besoin d&apos;automatisation</Label>
        <p className="text-sm text-muted-foreground">
          Ce que tu veux automatiser, en langage libre. L&apos;IA génère un workflow n8n simple
          (2 à 6 nœuds) à partir de ça.
        </p>
        <Textarea
          id="description"
          rows={6}
          placeholder="Ex : Quand je reçois une requête sur un webhook, je veux envoyer les données reçues vers une API externe par une requête HTTP..."
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon workflow gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton workflow</h3>
          <N8nWorkflowPreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ce workflow plus tard, ou partage-le — sans avoir besoin de créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici le workflow n8n que j'ai préparé : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/workflow-n8n/resultat/${shareSlug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "gap-2")}
            >
              <MessageCircle className="size-4" />
              Partager sur WhatsApp
            </a>
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/outils/workflow-n8n/resultat/${shareSlug}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Lien copié.");
                } catch {
                  toast.error("Impossible de copier le lien.");
                }
              }}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Copy className="size-4" />
              Copier le lien
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
