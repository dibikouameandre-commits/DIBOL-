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
import { generateContrat } from "@/server/tools/contrat";
import {
  contratFormSchema,
  contratTypeLabels,
  CONTRAT_PARTY_ROLES,
  factureCurrencyLabels,
  type ContratFormValues,
} from "@/lib/validations/tools";

export function ContratForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ContratFormValues>({
    resolver: zodResolver(contratFormSchema),
    defaultValues: { contratType: "prestation-service", currency: "XOF" },
  });

  const contratType = watch("contratType") || "prestation-service";
  const roles = CONTRAT_PARTY_ROLES[contratType];

  const onSubmit = async (values: ContratFormValues) => {
    setIsSubmitting(true);
    const result = await generateContrat(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/outils/contrat-simple/resultat/${result.shareSlug}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contratType">Type de contrat</Label>
        <Controller
          name="contratType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="contratType" className="w-full">
                <SelectValue placeholder="Choisir">
                  {(value: string) =>
                    contratTypeLabels[value as keyof typeof contratTypeLabels]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contratTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partyAName">{roles.partyA}</Label>
          <Input id="partyAName" placeholder="Awa Traoré" {...register("partyAName")} />
          {errors.partyAName && (
            <p className="text-sm text-destructive">{errors.partyAName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partyAAddress">Adresse (facultatif)</Label>
          <Input id="partyAAddress" placeholder="Cocody, Abidjan" {...register("partyAAddress")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partyBName">{roles.partyB}</Label>
          <Input id="partyBName" placeholder="Fournitures du Plateau" {...register("partyBName")} />
          {errors.partyBName && (
            <p className="text-sm text-destructive">{errors.partyBName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partyBAddress">Adresse (facultatif)</Label>
          <Input id="partyBAddress" placeholder="Plateau, Abidjan" {...register("partyBAddress")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="objet">Décris l&apos;objet du contrat</Label>
        <p className="text-sm text-muted-foreground">
          Ce sur quoi porte la prestation ou le bien loué — en langage libre. L&apos;IA rédige les
          clauses de base à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="objet"
          rows={5}
          placeholder="Ex : Prestation de nettoyage des bureaux de l'entreprise, deux fois par semaine..."
          {...register("objet")}
        />
        {errors.objet && <p className="text-sm text-destructive">{errors.objet.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Montant convenu</Label>
          <Input
            id="amount"
            type="number"
            step="any"
            min="0"
            placeholder="150000"
            {...register("amount", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Devise</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      factureCurrencyLabels[value as keyof typeof factureCurrencyLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(factureCurrencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="duration">Durée</Label>
          <Input id="duration" placeholder="3 mois" {...register("duration")} />
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">Ville (pour la date)</Label>
        <Input id="city" placeholder="Abidjan" {...register("city")} />
        {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon contrat"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Ce document est un modèle simplifié, à faire relire avant
        signature.
      </p>
    </form>
  );
}
