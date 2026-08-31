"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateBusinessPlan } from "@/server/tools/business-plan";
import {
  businessPlanFormSchema,
  type BusinessPlanFormValues,
} from "@/lib/validations/tools";

export function BusinessPlanForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessPlanFormValues>({
    resolver: zodResolver(businessPlanFormSchema),
  });

  const onSubmit = async (values: BusinessPlanFormValues) => {
    setIsSubmitting(true);
    const result = await generateBusinessPlan(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/outils/business-plan/resultat/${result.shareSlug}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="founderName">Ton nom</Label>
          <Input id="founderName" placeholder="Fatou Diarra" {...register("founderName")} />
          {errors.founderName && (
            <p className="text-sm text-destructive">{errors.founderName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="projectName">Nom du projet</Label>
          <Input id="projectName" placeholder="AgriFraîche" {...register("projectName")} />
          {errors.projectName && (
            <p className="text-sm text-destructive">{errors.projectName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="location">Ta ville</Label>
          <Input id="location" placeholder="Bamako" {...register("location")} />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activityDescription">Décris ton projet</Label>
        <p className="text-sm text-muted-foreground">
          Le problème que tu résous, ta solution, comment ça fonctionne — en langage libre. L&apos;IA
          structure ça en business plan, sans rien inventer.
        </p>
        <Textarea
          id="activityDescription"
          rows={6}
          placeholder="Ex : Je veux créer une plateforme qui connecte directement les petits producteurs maraîchers aux restaurants de Bamako, pour éviter les intermédiaires et garantir des produits plus frais à un meilleur prix..."
          {...register("activityDescription")}
        />
        {errors.activityDescription && (
          <p className="text-sm text-destructive">{errors.activityDescription.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="targetMarketInfo">Marché visé (facultatif)</Label>
        <Textarea
          id="targetMarketInfo"
          rows={3}
          placeholder="Ex : Une centaine de restaurants et hôtels à Bamako, plus les particuliers via une appli"
          {...register("targetMarketInfo")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="businessModelInfo">Modèle économique (facultatif)</Label>
        <Textarea
          id="businessModelInfo"
          rows={3}
          placeholder="Ex : Commission de 10% sur chaque livraison entre producteur et restaurant"
          {...register("businessModelInfo")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fundingAmount">Besoin de financement (facultatif)</Label>
        <Input
          id="fundingAmount"
          placeholder="Ex : 5 000 000 FCFA pour l'achat de véhicules de livraison"
          {...register("fundingAmount")}
        />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon business plan"}
      </Button>
    </form>
  );
}
