"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { MessageCircle, Copy } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  promptIaFormSchema,
  promptTaskTypeLabels,
  type PromptIaFormValues,
  type PromptIaContent,
} from "@/lib/validations/tools";
import { generatePromptIa } from "@/server/tools/prompt-ia";
import { PromptIaPreview } from "./prompt-ia-preview";

export function PromptIaForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<PromptIaContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PromptIaFormValues>({
    resolver: zodResolver(promptIaFormSchema),
    defaultValues: { taskType: "redaction" },
  });

  const onSubmit = async (values: PromptIaFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generatePromptIa(values);
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
    toast.success("Prompts générés.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="taskType">Type de tâche</Label>
        <Controller
          name="taskType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="taskType" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) =>
                    promptTaskTypeLabels[value as keyof typeof promptTaskTypeLabels]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(promptTaskTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.taskType && (
          <p className="text-sm text-destructive">{errors.taskType.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desiredFormat">Format de sortie souhaité (facultatif)</Label>
          <Input
            id="desiredFormat"
            placeholder="Ex : réponse sous forme de tableau"
            {...register("desiredFormat")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="constraints">Contraintes (facultatif)</Label>
          <Input
            id="constraints"
            placeholder="Ex : moins de 200 mots"
            {...register("constraints")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal">Décris ton objectif</Label>
        <p className="text-sm text-muted-foreground">
          Ce que tu veux obtenir d&apos;un assistant IA — en langage libre. L&apos;IA transforme ça
          en 3 versions de prompt optimisé, prêtes à coller.
        </p>
        <Textarea
          id="goal"
          rows={6}
          placeholder="Ex : Je veux que l'IA m'aide à rédiger des réponses aux avis clients négatifs sur mon restaurant, de façon professionnelle et apaisante..."
          {...register("goal")}
        />
        {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mes prompts gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Tes 3 versions de prompt</h3>
          <PromptIaPreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ces prompts plus tard, ou partage-les — sans avoir besoin de créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici les prompts que j'ai préparés : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/prompts-ia/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/prompts-ia/resultat/${shareSlug}`;
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
