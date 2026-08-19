"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/slugify";
import { createCompanyCategory, updateCompanyCategory } from "@/server/company-admin/categories";

type FormState = { success: boolean; error?: string } | null;

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export function CompanyCategoryDialog({
  entreprise,
  category,
  trigger,
}: {
  entreprise: string;
  category?: Category;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!category;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return isEdit
      ? updateCompanyCategory(entreprise, category.id, formData)
      : createCompanyCategory(entreprise, formData);
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Catégorie mise à jour" : "Catégorie créée");
      setOpen(false);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour les informations de la catégorie."
              : "Crée une nouvelle catégorie de produits."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} id="company-category-form" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Nom</Label>
            <Input
              id="cat-name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              name="description"
              rows={3}
              defaultValue={category?.description ?? ""}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" form="company-category-form" disabled={isPending}>
            {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
