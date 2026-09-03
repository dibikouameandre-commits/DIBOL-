"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, X, Plus, Trash2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { compressImageToDataUri } from "@/lib/client/compress-image";
import { CV_TEMPLATES } from "@/lib/tools/cv-templates";
import { generateCv } from "@/server/tools/cv";
import {
  cvFormSchema,
  experienceLevelLabels,
  skillLevelLabels,
  type CvFormValues,
} from "@/lib/validations/tools";

const emptyExperience = { title: "", company: "", period: "", description: "" };
const emptyEducation = { degree: "", school: "", year: "" };
const emptySkill: { name: string; level?: CvFormValues["skills"][number]["level"] } = {
  name: "",
  level: undefined,
};
const emptyLanguage = { name: "" };

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
    defaultValues: {
      experienceLevel: "debutant",
      templateId: "classique",
      experiences: [],
      education: [],
      skills: [],
      languages: [],
    },
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: "experiences" });
  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: "education" });
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: "skills" });
  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({ control, name: "languages" });

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
        <Label htmlFor="summary">Profil professionnel</Label>
        <p className="text-sm text-muted-foreground">
          Une ou deux phrases qui te présentent pour le poste visé. L&apos;IA améliore la
          formulation à partir de ce que tu écris ici, sans rien inventer.
        </p>
        <Textarea
          id="summary"
          rows={3}
          placeholder="Ex : Comptable rigoureuse avec 3 ans d'expérience en cabinet, à l'aise avec Excel et la gestion de trésorerie."
          {...register("summary")}
        />
        {errors.summary && (
          <p className="text-sm text-destructive">{errors.summary.message}</p>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Expériences professionnelles</h3>
            <p className="text-sm text-muted-foreground">Facultatif si tu débutes.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendExperience(emptyExperience)}
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {experienceFields.map((field, index) => {
            const rowErrors = errors.experiences?.[index];
            return (
              <div key={field.id} className="rounded-lg border p-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Poste</Label>
                    <Input placeholder="Vendeuse" {...register(`experiences.${index}.title`)} />
                    {rowErrors?.title && (
                      <p className="text-xs text-destructive">{rowErrors.title.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Entreprise</Label>
                    <Input
                      placeholder="Boutique Chic"
                      {...register(`experiences.${index}.company`)}
                    />
                    {rowErrors?.company && (
                      <p className="text-xs text-destructive">{rowErrors.company.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Période</Label>
                    <Input
                      placeholder="Janvier 2022 - Mars 2024"
                      {...register(`experiences.${index}.period`)}
                    />
                    {rowErrors?.period && (
                      <p className="text-xs text-destructive">{rowErrors.period.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      Ce que tu faisais
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Accueil client, gestion de caisse, mise en rayon..."
                      {...register(`experiences.${index}.description`)}
                    />
                    {rowErrors?.description && (
                      <p className="text-xs text-destructive">{rowErrors.description.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end border-t pt-3">
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
          {experienceFields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune expérience ajoutée.</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Formations</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendEducation(emptyEducation)}
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {educationFields.map((field, index) => {
            const rowErrors = errors.education?.[index];
            return (
              <div key={field.id} className="rounded-lg border p-3.5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Diplôme</Label>
                    <Input
                      placeholder="BTS Gestion commerciale"
                      {...register(`education.${index}.degree`)}
                    />
                    {rowErrors?.degree && (
                      <p className="text-xs text-destructive">{rowErrors.degree.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Établissement</Label>
                    <Input
                      placeholder="Institut Saint-Michel"
                      {...register(`education.${index}.school`)}
                    />
                    {rowErrors?.school && (
                      <p className="text-xs text-destructive">{rowErrors.school.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Année</Label>
                    <Input placeholder="2021" {...register(`education.${index}.year`)} />
                    {rowErrors?.year && (
                      <p className="text-xs text-destructive">{rowErrors.year.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end border-t pt-3">
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
          {educationFields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune formation ajoutée.</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Compétences</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSkill(emptySkill)}
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          {skillFields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2.5 rounded-lg border p-3 sm:flex-row sm:items-end"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Compétence</Label>
                <Input placeholder="Excel" {...register(`skills.${index}.name`)} />
                {errors.skills?.[index]?.name && (
                  <p className="text-xs text-destructive">
                    {errors.skills[index]?.name?.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 sm:w-48">
                <Label className="text-xs text-muted-foreground">Niveau (facultatif)</Label>
                <Controller
                  name={`skills.${index}.level`}
                  control={control}
                  render={({ field: levelField }) => (
                    <Select
                      value={levelField.value ?? "none"}
                      onValueChange={(value) =>
                        levelField.onChange(value === "none" ? undefined : value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Non précisé">
                          {(value: string) =>
                            value === "none"
                              ? "Non précisé"
                              : skillLevelLabels[value as keyof typeof skillLevelLabels]
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non précisé</SelectItem>
                        {Object.entries(skillLevelLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-destructive sm:self-auto sm:pb-2"
                aria-label="Retirer cette compétence"
              >
                <Trash2 className="size-3.5" />
                <span className="sm:hidden">Retirer</span>
              </button>
            </div>
          ))}
          {skillFields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune compétence ajoutée.</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Langues</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendLanguage(emptyLanguage)}
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          {languageFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder="Français (courant)"
                className="flex-1"
                {...register(`languages.${index}.name`)}
              />
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="flex items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Retirer cette langue"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {languageFields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune langue ajoutée.</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interests">Centres d&apos;intérêt (facultatif)</Label>
          <Textarea
            id="interests"
            rows={3}
            placeholder="Lecture, football, bénévolat..."
            {...register("interests")}
          />
          {errors.interests && (
            <p className="text-sm text-destructive">{errors.interests.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="additionalInfo">Informations complémentaires (facultatif)</Label>
          <Textarea
            id="additionalInfo"
            rows={3}
            placeholder="Permis de conduire, disponibilité immédiate, mobilité..."
            {...register("additionalInfo")}
          />
          {errors.additionalInfo && (
            <p className="text-sm text-destructive">{errors.additionalInfo.message}</p>
          )}
        </div>
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
