"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, X, Check, MessageCircle, Copy } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { QuotaIndicator } from "@/components/tools/quota-indicator";
import { cn } from "@/lib/utils";
import { compressImageToDataUri } from "@/lib/client/compress-image";
import { computeFactureTotals, formatFactureAmount } from "@/lib/tools/facture-calc";
import type { ToolQuotaStatus } from "@/lib/rate-limit";
import {
  factureFormSchema,
  factureDocumentTypeLabels,
  factureCurrencyLabels,
  type FactureFormValues,
  type FactureResultData,
} from "@/lib/validations/tools";
import { FACTURE_TEMPLATES } from "@/lib/tools/facture-templates";
import { FactureHtmlPreview } from "./templates";

// Étape 3 : l'aperçu (FactureHtmlPreview) se met à jour en direct pendant la
// saisie, à partir des mêmes totaux que le récapitulatif — aucun appel
// serveur pour ça. Le seul aller-retour serveur est la génération du PDF
// final au clic sur "Télécharger le PDF", qui revalide tout côté serveur
// (voir src/app/api/outils/facture-devis/pdf/route.ts) au lieu de faire
// confiance aux totaux déjà calculés ici.
const emptyLineItem = { description: "", quantity: 1, unitPrice: 0, discountPercent: 0 };

// react-hook-form renvoie des chaînes pour les inputs numériques — on convertit
// ici plutôt que dans le schéma, pour que factureFormSchema reste utilisable
// tel quel côté serveur avec de vrais nombres.
const toRequiredNumber = (value: string) => (value === "" ? Number.NaN : Number(value));
const toOptionalNumber = (value: string) => (value === "" ? undefined : Number(value));

function sanitize(value: number | undefined | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function FactureForm({ initialQuota }: { initialQuota: ToolQuotaStatus }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  // Pas de page résultat séparée pour cet outil (contrairement au CV/lettre)
  // — le quota affiché se met donc à jour directement ici après une
  // génération réussie, à partir des en-têtes de la réponse PDF, plutôt que
  // via un rechargement de page.
  const [quota, setQuota] = useState<ToolQuotaStatus>(initialQuota);
  // Étape 6 : lien de partage du dernier document généré avec succès —
  // permet d'envoyer le document à un client (WhatsApp, copier-coller...)
  // sans jamais changer le comportement du téléchargement direct existant.
  const [shareInfo, setShareInfo] = useState<{
    shareSlug: string;
    docLabel: string;
    documentNumber: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FactureFormValues>({
    resolver: zodResolver(factureFormSchema),
    defaultValues: {
      documentType: "facture",
      templateId: "classique",
      documentNumber: "",
      documentDate: "",
      currency: "XOF",
      lineItems: [emptyLineItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  const watchedItems = useWatch({ control, name: "lineItems" });
  const watchedGlobalDiscount = useWatch({ control, name: "globalDiscountPercent" });
  const watchedTax = useWatch({ control, name: "taxRatePercent" });
  const watchedCurrency = useWatch({ control, name: "currency" }) || "XOF";
  const watchedTemplateId = useWatch({ control, name: "templateId" }) || "classique";
  const allValues = useWatch({ control });

  const totals = computeFactureTotals(
    (watchedItems ?? []).map((item) => ({
      description: item?.description ?? "",
      quantity: sanitize(item?.quantity),
      unitPrice: sanitize(item?.unitPrice),
      discountPercent: sanitize(item?.discountPercent),
    })),
    {
      globalDiscountPercent: sanitize(watchedGlobalDiscount),
      taxRatePercent: sanitize(watchedTax),
    }
  );

  // Aperçu : même forme que ce que le serveur produit (FactureResultData),
  // mais tolérant à un formulaire encore incomplet — les champs vides
  // s'affichent avec un texte de substitution dans FactureHtmlPreview.
  const previewData: FactureResultData = {
    form: {
      documentType: allValues.documentType ?? "facture",
      templateId: watchedTemplateId,
      documentNumber: allValues.documentNumber ?? "",
      documentDate: allValues.documentDate ?? "",
      dueDate: allValues.dueDate,
      issuerName: allValues.issuerName ?? "",
      issuerAddress: allValues.issuerAddress,
      issuerPhone: allValues.issuerPhone,
      issuerEmail: allValues.issuerEmail,
      issuerTaxId: allValues.issuerTaxId,
      issuerLogoDataUri: allValues.issuerLogoDataUri,
      clientName: allValues.clientName ?? "",
      clientAddress: allValues.clientAddress,
      clientPhone: allValues.clientPhone,
      clientEmail: allValues.clientEmail,
      currency: watchedCurrency,
      lineItems: watchedItems ?? [],
      globalDiscountPercent: allValues.globalDiscountPercent,
      taxRatePercent: allValues.taxRatePercent,
      paymentTerms: allValues.paymentTerms,
      notes: allValues.notes,
    },
    totals,
    createdAt: new Date().toISOString(),
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Choisis un fichier image.");
      return;
    }

    try {
      const dataUri = await compressImageToDataUri(file, 400, 0.85);
      setValue("issuerLogoDataUri", dataUri);
      setLogoPreview(dataUri);
      setLogoError(null);
    } catch {
      setLogoError("Impossible de traiter ce logo, réessaie avec une autre image.");
    }
  };

  const removeLogo = () => {
    setValue("issuerLogoDataUri", undefined);
    setLogoPreview(null);
  };

  const onSubmit = async (values: FactureFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/outils/facture-devis/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        toast.error(errorBody?.error ?? "Impossible de générer le PDF, réessaie.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "document.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const remainingHeader = res.headers.get("X-Quota-Remaining");
      const limitHeader = res.headers.get("X-Quota-Limit");
      if (remainingHeader !== null && limitHeader !== null) {
        setQuota({
          remaining: Number(remainingHeader),
          limit: Number(limitHeader),
          blocked: res.headers.get("X-Quota-Blocked") === "1",
        });
      }

      const shareSlug = res.headers.get("X-Share-Slug");
      if (shareSlug) {
        setShareInfo({
          shareSlug,
          docLabel: values.documentType === "devis" ? "Devis" : "Facture",
          documentNumber: values.documentNumber,
        });
      }

      toast.success("PDF généré et téléchargé.");
    } catch {
      toast.error("Impossible de générer le PDF, réessaie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <div className="flex flex-col gap-2">
        <Label>Type de document</Label>
        <Controller
          name="documentType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(factureDocumentTypeLabels).map(([value, label]) => {
                const isSelected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="documentNumber">Numéro du document</Label>
          <Input
            id="documentNumber"
            placeholder="FAC-2026-001"
            {...register("documentNumber")}
          />
          {errors.documentNumber && (
            <p className="text-sm text-destructive">{errors.documentNumber.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="documentDate">Date</Label>
          <Input id="documentDate" type="date" {...register("documentDate")} />
          {errors.documentDate && (
            <p className="text-sm text-destructive">{errors.documentDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Échéance (facultatif)</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton entreprise</h3>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un data URI compressé */}
                <img
                  src={logoPreview}
                  alt="Aperçu du logo"
                  className="size-16 rounded-lg border object-contain p-1"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  aria-label="Retirer le logo"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Label htmlFor="issuerLogo" className="text-xs font-normal text-muted-foreground">
                  Logo (facultatif)
                </Label>
                <Input
                  id="issuerLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
          {logoError && <p className="text-sm text-destructive">{logoError}</p>}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuerName">Nom de l&apos;entreprise</Label>
            <Input id="issuerName" placeholder="Atelier Kaba Couture" {...register("issuerName")} />
            {errors.issuerName && (
              <p className="text-sm text-destructive">{errors.issuerName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuerAddress">Adresse (facultatif)</Label>
            <Textarea id="issuerAddress" rows={2} {...register("issuerAddress")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issuerPhone">Téléphone (facultatif)</Label>
              <Input id="issuerPhone" placeholder="+225 07 00 00 00 00" {...register("issuerPhone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issuerEmail">Email (facultatif)</Label>
              <Input
                id="issuerEmail"
                type="email"
                placeholder="contact@entreprise.com"
                {...register("issuerEmail")}
              />
              {errors.issuerEmail && (
                <p className="text-sm text-destructive">{errors.issuerEmail.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuerTaxId">
              Numéro fiscal / RCCM (facultatif)
            </Label>
            <Input id="issuerTaxId" {...register("issuerTaxId")} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold">Ton client</h3>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clientName">Nom du client</Label>
            <Input id="clientName" placeholder="Mme Diakité" {...register("clientName")} />
            {errors.clientName && (
              <p className="text-sm text-destructive">{errors.clientName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clientAddress">Adresse (facultatif)</Label>
            <Textarea id="clientAddress" rows={2} {...register("clientAddress")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientPhone">Téléphone (facultatif)</Label>
              <Input id="clientPhone" {...register("clientPhone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientEmail">Email (facultatif)</Label>
              <Input id="clientEmail" type="email" {...register("clientEmail")} />
              {errors.clientEmail && (
                <p className="text-sm text-destructive">{errors.clientEmail.message}</p>
              )}
            </div>
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
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Articles / prestations</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyLineItem)}
          >
            <Plus className="size-4" />
            Ajouter une ligne
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const lineErrors = errors.lineItems?.[index];
            const item = watchedItems?.[index];
            const lineTotal = computeFactureTotals([
              {
                description: item?.description ?? "",
                quantity: sanitize(item?.quantity),
                unitPrice: sanitize(item?.unitPrice),
                discountPercent: sanitize(item?.discountPercent),
              },
            ]).grandTotal;

            return (
              <div key={field.id} className="rounded-lg border p-3.5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_90px_120px_90px]">
                  <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      placeholder="Robe sur mesure"
                      {...register(`lineItems.${index}.description`)}
                    />
                    {lineErrors?.description && (
                      <p className="text-xs text-destructive">
                        {lineErrors.description.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Quantité</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`lineItems.${index}.quantity`, {
                        setValueAs: toRequiredNumber,
                      })}
                    />
                    {lineErrors?.quantity && (
                      <p className="text-xs text-destructive">{lineErrors.quantity.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Prix unitaire</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`lineItems.${index}.unitPrice`, {
                        setValueAs: toRequiredNumber,
                      })}
                    />
                    {lineErrors?.unitPrice && (
                      <p className="text-xs text-destructive">{lineErrors.unitPrice.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Remise %</Label>
                    <Input
                      type="number"
                      step="any"
                      {...register(`lineItems.${index}.discountPercent`, {
                        setValueAs: toOptionalNumber,
                      })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">
                    Total ligne :{" "}
                    <span className="font-medium text-foreground">
                      {formatFactureAmount(lineTotal, watchedCurrency)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {errors.lineItems?.message && (
          <p className="text-sm text-destructive">{errors.lineItems.message}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="globalDiscountPercent">Remise globale % (facultatif)</Label>
            <Input
              id="globalDiscountPercent"
              type="number"
              step="any"
              {...register("globalDiscountPercent", { setValueAs: toOptionalNumber })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxRatePercent">Taux de taxe % (facultatif)</Label>
            <Input
              id="taxRatePercent"
              type="number"
              step="any"
              {...register("taxRatePercent", { setValueAs: toOptionalNumber })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="mb-3 font-semibold">Récapitulatif</h3>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Sous-total</dt>
            <dd className="font-medium tabular-nums">
              {formatFactureAmount(totals.subtotal, watchedCurrency)}
            </dd>
          </div>
          {totals.globalDiscountAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Remise globale ({totals.globalDiscountPercent}%)
              </dt>
              <dd className="font-medium tabular-nums">
                -{formatFactureAmount(totals.globalDiscountAmount, watchedCurrency)}
              </dd>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxe ({totals.taxRatePercent}%)</dt>
              <dd className="font-medium tabular-nums">
                {formatFactureAmount(totals.taxAmount, watchedCurrency)}
              </dd>
            </div>
          )}
          <Separator className="my-1.5" />
          <div className="flex justify-between text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold tabular-nums">
              {formatFactureAmount(totals.grandTotal, watchedCurrency)}
            </dd>
          </div>
        </dl>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">Conditions & notes</h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paymentTerms">Conditions de paiement (facultatif)</Label>
          <Textarea
            id="paymentTerms"
            rows={2}
            placeholder="Paiement à réception, virement Mobile Money accepté."
            {...register("paymentTerms")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes (facultatif)</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">Modèle du document</h3>
        <Controller
          name="templateId"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {FACTURE_TEMPLATES.map((template) => {
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

        <p className="text-sm text-muted-foreground">
          Cet aperçu correspond exactement au PDF que tu vas télécharger — il se met à jour au
          fur et à mesure de ta saisie.
        </p>
        <div className="w-full overflow-x-auto rounded-lg border shadow-sm">
          <div className="mx-auto" style={{ minWidth: 640, maxWidth: 700 }}>
            <FactureHtmlPreview data={previewData} templateId={watchedTemplateId} />
          </div>
        </div>
      </div>

      <QuotaIndicator remaining={quota.remaining} limit={quota.limit} blocked={quota.blocked} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Génération du PDF..." : "Télécharger le PDF"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Le document est conservé 90 jours pour permettre le partage par lien ci-dessous — jamais
        utilisé à d&apos;autres fins.
      </p>

      {shareInfo && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
          <div>
            <h3 className="font-semibold">Partager ce document</h3>
            <p className="text-sm text-muted-foreground">
              Envoie ce lien à ton client — il pourra voir et télécharger {shareInfo.docLabel.toLowerCase()}{" "}
              {shareInfo.documentNumber} sans avoir besoin de créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Bonjour, voici votre ${shareInfo.docLabel.toLowerCase()} ${shareInfo.documentNumber} : ${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/outils/facture-devis/resultat/${shareInfo.shareSlug}`
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
                const url = `${window.location.origin}/outils/facture-devis/resultat/${shareInfo.shareSlug}`;
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
