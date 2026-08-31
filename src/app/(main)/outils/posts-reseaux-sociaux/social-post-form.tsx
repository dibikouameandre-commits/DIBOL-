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
  socialPostFormSchema,
  socialPlatformLabels,
  type SocialPostFormValues,
  type SocialPostContent,
} from "@/lib/validations/tools";
import { generateSocialPost } from "@/server/tools/social-post";
import { SocialPostPreview } from "./social-post-preview";

export function SocialPostForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<SocialPostContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SocialPostFormValues>({
    resolver: zodResolver(socialPostFormSchema),
    defaultValues: { platform: "facebook" },
  });

  const onSubmit = async (values: SocialPostFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateSocialPost(values);
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
    toast.success("Posts générés.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="platform">Réseau ciblé</Label>
        <Controller
          name="platform"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="platform" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) =>
                    socialPlatformLabels[value as keyof typeof socialPlatformLabels]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(socialPlatformLabels).map(([value, label]) => (
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="businessName">Nom de ton activité (facultatif)</Label>
          <Input id="businessName" placeholder="Chez Aïcha Traiteur" {...register("businessName")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="callToAction">Appel à l&apos;action (facultatif)</Label>
          <Input
            id="callToAction"
            placeholder="Commande au 07 00 00 00 00"
            {...register("callToAction")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="context">Décris ce que tu veux communiquer</Label>
        <p className="text-sm text-muted-foreground">
          Ton produit, ta promotion, ton actualité — en langage libre. L&apos;IA rédige 3 variantes
          de post à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="context"
          rows={6}
          placeholder="Ex : Je vends des plats traiteur pour événements à Abidjan. Ce week-end, promotion de 10% sur les commandes de plus de 20 personnes..."
          {...register("context")}
        />
        {errors.context && (
          <p className="text-sm text-destructive">{errors.context.message}</p>
        )}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mes posts gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Tes 3 variantes</h3>
          <SocialPostPreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ces posts plus tard, ou partage-les pour relecture — sans avoir besoin de
              créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici les posts que j'ai préparés : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/posts-reseaux-sociaux/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/posts-reseaux-sociaux/resultat/${shareSlug}`;
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
