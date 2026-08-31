"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { generateLettreAdmin } from "@/server/tools/lettre-admin";
import {
  lettreAdminFormSchema,
  lettreAdminTypeLabels,
  type LettreAdminFormValues,
} from "@/lib/validations/tools";

export function LettreAdminForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LettreAdminFormValues>({
    resolver: zodResolver(lettreAdminFormSchema),
    defaultValues: { lettreType: "demande-attestation" },
  });

  const onSubmit = async (values: LettreAdminFormValues) => {
    setIsSubmitting(true);
    const result = await generateLettreAdmin(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/outils/lettre-administrative/resultat/${result.shareSlug}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lettreType">Type de lettre</Label>
        <Controller
          name="lettreType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="lettreType" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) =>
                    lettreAdminTypeLabels[value as keyof typeof lettreAdminTypeLabels]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(lettreAdminTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.lettreType && (
          <p className="text-sm text-destructive">{errors.lettreType.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senderName">Ton nom complet</Label>
          <Input id="senderName" placeholder="Awa Traoré" {...register("senderName")} />
          {errors.senderName && (
            <p className="text-sm text-destructive">{errors.senderName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Ta ville (pour la date)</Label>
          <Input id="city" placeholder="Abidjan" {...register("city")} />
          {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senderAddress">Ton adresse (facultatif)</Label>
          <Input
            id="senderAddress"
            placeholder="Cocody, Abidjan"
            {...register("senderAddress")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senderPhone">Ton téléphone (facultatif)</Label>
          <Input id="senderPhone" placeholder="+225 07 00 00 00 00" {...register("senderPhone")} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="senderEmail">Ton e-mail (facultatif)</Label>
          <Input
            id="senderEmail"
            type="email"
            placeholder="awa.traore@exemple.com"
            {...register("senderEmail")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientName">Destinataire</Label>
          <Input
            id="recipientName"
            placeholder="Direction des Ressources Humaines"
            {...register("recipientName")}
          />
          {errors.recipientName && (
            <p className="text-sm text-destructive">{errors.recipientName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientAddress">Adresse du destinataire (facultatif)</Label>
          <Input
            id="recipientAddress"
            placeholder="Fournitures du Plateau, Abidjan"
            {...register("recipientAddress")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="context">Décris la situation</Label>
        <p className="text-sm text-muted-foreground">
          Explique en langage libre le motif de la lettre, les faits et dates utiles, ce que tu
          demandes — l&apos;IA rédige la lettre à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="context"
          rows={7}
          placeholder="Ex : Je travaille dans l'entreprise depuis 2 ans en tant que comptable et j'ai besoin d'une attestation de travail pour une démarche bancaire..."
          {...register("context")}
        />
        {errors.context && (
          <p className="text-sm text-destructive">{errors.context.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer ma lettre gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>
    </form>
  );
}
