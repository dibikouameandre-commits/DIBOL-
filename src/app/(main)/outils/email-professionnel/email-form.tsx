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
  emailFormSchema,
  emailTypeLabels,
  emailToneLabels,
  type EmailFormValues,
  type EmailContent,
} from "@/lib/validations/tools";
import { formatEmailAsText } from "@/lib/tools/email-format";
import { generateEmail } from "@/server/tools/email";
import { EmailPreview } from "./email-preview";

// Étape 6 : chaque génération réussie renvoie aussi un shareSlug (voir
// src/server/tools/email.ts) — utilisé ici pour proposer un lien de partage
// (WhatsApp, copier le lien) vers la page résultat publique, en plus de la
// copie directe du texte déjà disponible depuis l'Étape 3.
export function EmailForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<EmailContent | null>(null);
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      emailType: "relance",
      tone: "neutre",
    },
  });

  const onSubmit = async (values: EmailFormValues) => {
    setIsSubmitting(true);
    setContent(null);
    setShareSlug(null);
    const result = await generateEmail(values);
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
    toast.success("E-mail généré.");
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(formatEmailAsText(content));
      toast.success("E-mail copié.");
    } catch {
      toast.error("Impossible de copier l'e-mail.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emailType">Type d&apos;e-mail</Label>
          <Controller
            name="emailType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="emailType" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      emailTypeLabels[value as keyof typeof emailTypeLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.emailType && (
            <p className="text-sm text-destructive">{errors.emailType.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tone">Ton</Label>
          <Controller
            name="tone"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tone" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      emailToneLabels[value as keyof typeof emailToneLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailToneLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tone && <p className="text-sm text-destructive">{errors.tone.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senderName">Ton nom</Label>
          <Input id="senderName" placeholder="Awa Traoré" {...register("senderName")} />
          {errors.senderName && (
            <p className="text-sm text-destructive">{errors.senderName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senderRole">Ton poste / fonction (facultatif)</Label>
          <Input id="senderRole" placeholder="Responsable achats" {...register("senderRole")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientName">Nom du destinataire (facultatif)</Label>
          <Input id="recipientName" placeholder="Mme Bamba" {...register("recipientName")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientCompany">Entreprise du destinataire (facultatif)</Label>
          <Input
            id="recipientCompany"
            placeholder="Fournitures du Plateau"
            {...register("recipientCompany")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="context">Décris la situation</Label>
        <p className="text-sm text-muted-foreground">
          Explique en langage libre pourquoi tu écris, ce qui s&apos;est passé, ce que tu attends
          — l&apos;IA rédige l&apos;e-mail à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="context"
          rows={7}
          placeholder="Ex : J'ai envoyé un email le 10 mars concernant la facture 123 et je n'ai reçu aucune réponse depuis. Je voudrais relancer poliment mais fermement..."
          {...register("context")}
        />
        {errors.context && (
          <p className="text-sm text-destructive">{errors.context.message}</p>
        )}
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon e-mail gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>

      {content && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton e-mail</h3>
          <EmailPreview content={content} />
          <Button type="button" variant="outline" onClick={handleCopy} className="w-full sm:w-fit">
            Copier l&apos;e-mail
          </Button>
        </div>
      )}

      {shareSlug && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce lien</h3>
            <p className="text-sm text-muted-foreground">
              Retrouve cet e-mail plus tard, ou partage-le pour relecture — sans avoir besoin de
              créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Voici l'e-mail que j'ai préparé : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/email-professionnel/resultat/${shareSlug}`
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
                const url = `${window.location.origin}/outils/email-professionnel/resultat/${shareSlug}`;
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
