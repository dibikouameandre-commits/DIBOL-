"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { LETTER_TEMPLATES } from "@/lib/tools/letter-templates";
import { generateLetter } from "@/server/tools/letter";
import {
  letterFormSchema,
  letterLengthLabels,
  letterToneLabels,
  type LetterFormValues,
} from "@/lib/validations/tools";

export function LetterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LetterFormValues>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: { templateId: "classique", length: "standard", tone: "professionnel" },
  });

  const onSubmit = async (values: LetterFormValues) => {
    setIsSubmitting(true);
    const result = await generateLetter(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/outils/lettre-motivation/resultat/${result.shareSlug}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Modèle de lettre</Label>
        <Controller
          name="templateId"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {LETTER_TEMPLATES.map((template) => {
                const isSelected = field.value === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => field.onChange(template.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    )}
                  >
                    <span
                      className="mt-0.5 size-4 shrink-0 rounded-full"
                      style={{ backgroundColor: template.accent }}
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        {template.name}
                        {isSelected && <Check className="size-3.5 text-primary" />}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" placeholder="Aïcha Koné" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Ville, pays</Label>
          <Input id="location" placeholder="Abidjan, Côte d'Ivoire" {...register("location")} />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" placeholder="+225 07 00 00 00 00" {...register("phone")} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="aicha.kone@exemple.com" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetRole">Poste visé</Label>
          <Input id="targetRole" placeholder="Comptable" {...register("targetRole")} />
          {errors.targetRole && (
            <p className="text-sm text-destructive">{errors.targetRole.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="companyName">Entreprise ciblée</Label>
          <Input id="companyName" placeholder="Sahel Compta" {...register("companyName")} />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="hiringManagerName">Destinataire (facultatif)</Label>
          <Input
            id="hiringManagerName"
            placeholder="Ex : Mme Sanou, Responsable RH"
            {...register("hiringManagerName")}
          />
          <p className="text-xs text-muted-foreground">
            Laisse vide pour une formule générique (« Madame, Monsieur »).
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="length">Longueur</Label>
          <Controller
            name="length"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="length" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      letterLengthLabels[value as keyof typeof letterLengthLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(letterLengthLabels).map(([value, label]) => (
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
          <Label htmlFor="tone">Ton</Label>
          <Controller
            name="tone"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tone" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) => letterToneLabels[value as keyof typeof letterToneLabels]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(letterToneLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="background">Ton parcours et ta motivation</Label>
        <p className="text-sm text-muted-foreground">
          Pourquoi ce poste, cette entreprise, ce que tu as fait qui est pertinent — en langage
          libre. L&apos;IA rédige la lettre à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="background"
          rows={7}
          placeholder="Ex : Je m'intéresse à ce poste parce que... J'ai 3 ans d'expérience en tant que... où j'ai notamment..."
          {...register("background")}
        />
        {errors.background && (
          <p className="text-sm text-destructive">{errors.background.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="offerText">Offre d&apos;emploi (facultatif)</Label>
        <p className="text-sm text-muted-foreground">
          Colle l&apos;offre pour que la lettre s&apos;y adapte davantage, avec un score de
          correspondance à la clé.
        </p>
        <Textarea
          id="offerText"
          rows={5}
          placeholder="Colle ici le texte de l'offre d'emploi..."
          {...register("offerText")}
        />
        {errors.offerText && (
          <p className="text-sm text-destructive">{errors.offerText.message}</p>
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
