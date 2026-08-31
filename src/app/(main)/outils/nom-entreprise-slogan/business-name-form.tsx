"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { MessageCircle, Copy } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { cn } from "@/lib/utils";
import type { ToolQuotaStatus } from "@/lib/rate-limit";
import {
  businessNameFormSchema,
  type BusinessNameFormValues,
  type BusinessNameContent,
} from "@/lib/validations/tools";
import { generateBusinessName } from "@/server/tools/business-name";
import { BusinessNamePreview } from "./business-name-preview";

export function BusinessNameForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<BusinessNameContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessNameFormValues>({
    resolver: zodResolver(businessNameFormSchema),
  });

  const onSubmit = async (values: BusinessNameFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateBusinessName(values);
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
    toast.success("Propositions générées.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="style">Style souhaité (facultatif)</Label>
          <Input id="style" placeholder="Ex : moderne et dynamique" {...register("style")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetAudience">Public visé (facultatif)</Label>
          <Input
            id="targetAudience"
            placeholder="Ex : jeunes professionnels à Abidjan"
            {...register("targetAudience")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activityDescription">Décris ton activité</Label>
        <p className="text-sm text-muted-foreground">
          Ce que tu vends ou proposes, à qui, et ce qui te distingue — en langage libre. L&apos;IA
          propose 5 à 6 noms et slogans à partir de ça, sans rien inventer sur ton activité.
        </p>
        <Textarea
          id="activityDescription"
          rows={6}
          placeholder="Ex : Je veux lancer un service de livraison de repas faits maison pour les employés de bureau à Dakar, avec des plats sains et locaux..."
          {...register("activityDescription")}
        />
        {errors.activityDescription && (
          <p className="text-sm text-destructive">{errors.activityDescription.message}</p>
        )}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mes propositions gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Tes propositions</h3>
          <BusinessNamePreview content={content} />
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve ces propositions plus tard, ou partage-les pour avis — sans avoir besoin de
              créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici les propositions de nom que j'ai reçues : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/nom-entreprise-slogan/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/nom-entreprise-slogan/resultat/${shareSlug}`;
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
