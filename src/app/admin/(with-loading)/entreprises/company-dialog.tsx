"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCompany, updateCompany } from "@/server/admin/companies";

type FormState = { success: boolean; error?: string } | null;

type Company = {
  id: string;
  name: string;
  slug: string;
};

export function CompanyDialog({
  company,
  trigger,
}: {
  company?: Company;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!company;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(company?.name ?? "");
  const [slug, setSlug] = useState(company?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return isEdit
      ? updateCompany(company.id, formData)
      : createCompany(formData);
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Entreprise mise à jour" : "Entreprise créée");
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
            {isEdit ? "Modifier l'entreprise" : "Nouvelle entreprise"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour les informations de l'entreprise."
              : "Crée une nouvelle entreprise sur la plateforme."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} id="company-form" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name">Nom</Label>
            <Input
              id="company-name"
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
            <Label htmlFor="company-slug">Slug</Label>
            <Input
              id="company-slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" form="company-form" disabled={isPending}>
            {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
