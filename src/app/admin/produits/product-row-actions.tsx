"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteProduct, toggleProductPublished } from "@/server/admin/products";

export function ProductRowActions({
  id,
  name,
  isPublished,
}: {
  id: string;
  name: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleProductPublished(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.success) {
        toast.error(result.error);
        setOpen(false);
        return;
      }
      toast.success("Produit supprimé");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={handleToggle}
        aria-label={isPublished ? "Dépublier" : "Publier"}
      >
        {isPublished ? <EyeOff /> : <Eye />}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Trash2 className="text-destructive" />
          <span className="sr-only">Supprimer</span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer « {name} » ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le produit ne peut pas être
              supprimé s&apos;il a déjà été commandé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
