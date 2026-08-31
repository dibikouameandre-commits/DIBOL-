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
  resumeDocumentFormSchema,
  resumeModeLabels,
  type ResumeDocumentFormValues,
  type ResumeDocumentContent,
} from "@/lib/validations/tools";
import { generateResumeDocument } from "@/server/tools/resume-document";
import { ResumeDocumentPreview } from "./resume-document-preview";

export function ResumeDocumentForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<ResumeDocumentContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResumeDocumentFormValues>({
    resolver: zodResolver(resumeDocumentFormSchema),
    defaultValues: { mode: "resume-court" },
  });

  const onSubmit = async (values: ResumeDocumentFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateResumeDocument(values);
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
    toast.success("Résultat généré.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mode">Mode</Label>
        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="mode" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) => resumeModeLabels[value as keyof typeof resumeModeLabels]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(resumeModeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.mode && <p className="text-sm text-destructive">{errors.mode.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sourceText">Colle ton texte</Label>
        <p className="text-sm text-muted-foreground">
          Le texte à condenser ou reformuler. L&apos;IA travaille uniquement à partir de ce que tu
          colles ici, sans rien inventer ni supprimer d&apos;information importante.
        </p>
        <Textarea
          id="sourceText"
          rows={10}
          placeholder="Colle ici le texte à résumer ou reformuler..."
          {...register("sourceText")}
        />
        {errors.sourceText && (
          <p className="text-sm text-destructive">{errors.sourceText.message}</p>
        )}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton résultat</h3>
          <ResumeDocumentPreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ce résultat plus tard, ou partage-le — sans avoir besoin de créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici le résultat que j'ai préparé : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/resume-document/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/resume-document/resultat/${shareSlug}`;
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
