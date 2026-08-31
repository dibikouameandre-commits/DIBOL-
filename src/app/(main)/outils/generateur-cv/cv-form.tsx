"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

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
import { compressImageToDataUri } from "@/lib/client/compress-image";
import { CV_TEMPLATES } from "@/lib/tools/cv-templates";
import { generateCv } from "@/server/tools/cv";
import {
  cvFormSchema,
  experienceLevelLabels,
  type CvFormValues,
} from "@/lib/validations/tools";

export function CvForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CvFormValues>({
    resolver: zodResolver(cvFormSchema),
    defaultValues: { experienceLevel: "debutant", templateId: "classique" },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choisis un fichier image.");
      return;
    }

    try {
      const dataUri = await compressImageToDataUri(file);
      setValue("photoDataUri", dataUri);
      setPhotoPreview(dataUri);
      setPhotoError(null);
    } catch {
      setPhotoError("Impossible de traiter cette photo, réessaie avec une autre.");
    }
  };

  const removePhoto = () => {
    setValue("photoDataUri", undefined);
    setPhotoPreview(null);
  };

  const onSubmit = async (values: CvFormValues) => {
    setIsSubmitting(true);
    const result = await generateCv(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.push(`/outils/generateur-cv/resultat/${result.shareSlug}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Modèle de CV</Label>
        <Controller
          name="templateId"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CV_TEMPLATES.map((template) => {
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="photo">Photo (facultatif)</Label>
        <div className="flex items-center gap-3">
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a compressed data URI */}
              <img
                src={photoPreview}
                alt="Aperçu de la photo"
                className="size-16 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Retirer la photo"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="max-w-xs" />
          )}
        </div>
        {photoError && <p className="text-sm text-destructive">{photoError}</p>}
        <p className="text-xs text-muted-foreground">
          Facultatif — une photo professionnelle simple, format portrait.
        </p>
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
          <Label htmlFor="targetRole">Poste visé</Label>
          <Input id="targetRole" placeholder="Comptable" {...register("targetRole")} />
          {errors.targetRole && (
            <p className="text-sm text-destructive">{errors.targetRole.message}</p>
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
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="aicha.kone@exemple.com" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="experienceLevel">Niveau d&apos;expérience</Label>
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="experienceLevel" className="w-full">
                  <SelectValue placeholder="Choisir">
                    {(value: string) =>
                      experienceLevelLabels[value as keyof typeof experienceLevelLabels]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(experienceLevelLabels).map(([value, label]) => (
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
        <Label htmlFor="background">Raconte ton parcours</Label>
        <p className="text-sm text-muted-foreground">
          Tes expériences, tes diplômes, tes compétences — en langage libre, comme tu les
          expliquerais à quelqu&apos;un. Précise ton niveau si tu le connais (« je maîtrise
          Excel », « bonnes notions d&apos;anglais »). L&apos;IA se charge de structurer un CV
          professionnel à partir de ça, sans rien inventer.
        </p>
        <Textarea
          id="background"
          rows={8}
          placeholder="Ex : J'ai travaillé 2 ans comme vendeuse chez... avant ça j'ai eu mon BTS en gestion commerciale à... Je maîtrise Excel et j'ai l'habitude de gérer une caisse..."
          {...register("background")}
        />
        {errors.background && (
          <p className="text-sm text-destructive">{errors.background.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération en cours..." : "Générer mon CV gratuitement"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gratuit, sans carte bancaire. Quelques générations par jour, pour éviter les abus.
      </p>
    </form>
  );
}
