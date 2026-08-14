"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { slugify } from "@/lib/slugify";
import { createProduct, updateProduct } from "@/server/admin/products";

type FormState = { success: boolean; error?: string } | null;

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: unknown;
  categoryId: string;
  isPublished: boolean;
  fileName: string | null;
};

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: Product;
}) {
  const router = useRouter();
  const isEdit = !!product;

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    if (isEdit) {
      return updateProduct(product.id, formData);
    }
    return createProduct(formData);
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Produit mis à jour" : "Produit créé");
      if (isEdit) router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
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
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
        />
        <p className="text-xs text-muted-foreground">
          Utilisé dans l&apos;URL : /produits/{slug || "..."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Prix (€)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product ? String(product.price) : undefined}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Catégorie</Label>
          <Select name="categoryId" defaultValue={product?.categoryId}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Choisir une catégorie">
                {(value: string) =>
                  categories.find((category) => category.id === value)?.name
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file">Fichier téléchargeable</Label>
        <input
          id="file"
          name="file"
          type="file"
          className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium"
        />
        {product?.fileName && (
          <p className="text-xs text-muted-foreground">
            Fichier actuel : {product.fileName} — choisis un nouveau fichier
            pour le remplacer.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isPublished"
          name="isPublished"
          type="checkbox"
          defaultChecked={product?.isPublished ?? false}
          className="size-4 accent-primary"
        />
        <Label htmlFor="isPublished" className="font-normal">
          Publié (visible dans la boutique)
        </Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending
          ? "Enregistrement..."
          : isEdit
            ? "Enregistrer les modifications"
            : "Créer le produit"}
      </Button>
    </form>
  );
}
