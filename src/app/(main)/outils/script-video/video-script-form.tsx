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
  videoScriptFormSchema,
  videoPlatformLabels,
  videoDurationLabels,
  type VideoScriptFormValues,
  type VideoScriptContent,
} from "@/lib/validations/tools";
import { generateVideoScript } from "@/server/tools/video-script";
import { VideoScriptPreview } from "./video-script-preview";

export function VideoScriptForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<VideoScriptContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VideoScriptFormValues>({
    resolver: zodResolver(videoScriptFormSchema),
    defaultValues: { platform: "tiktok", duration: "30s" },
  });

  const onSubmit = async (values: VideoScriptFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateVideoScript(values);
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
    toast.success("Script généré.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="platform">Plateforme</Label>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="platform" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      videoPlatformLabels[value as keyof typeof videoPlatformLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(videoPlatformLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.platform && (
            <p className="text-sm text-destructive">{errors.platform.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="duration">Durée cible</Label>
          <Controller
            name="duration"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="duration" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      videoDurationLabels[value as keyof typeof videoDurationLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(videoDurationLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject">Décris le sujet de ta vidéo</Label>
        <p className="text-sm text-muted-foreground">
          Ton produit, ton message, ce que tu veux montrer — en langage libre. L&apos;IA rédige un
          script séquencé à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="subject"
          rows={6}
          placeholder="Ex : Je veux présenter mes 3 astuces pour bien nettoyer des baskets blanches à la maison, avec des produits qu'on a déjà chez soi..."
          {...register("subject")}
        />
        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon script gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton script</h3>
          <VideoScriptPreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ce script plus tard, ou partage-le — sans avoir besoin de créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici le script vidéo que j'ai préparé : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/script-video/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/script-video/resultat/${shareSlug}`;
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
