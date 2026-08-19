"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toggleCompanyUserActive } from "@/server/company-admin/users";

export function CompanyUserStatusButton({
  entreprise,
  userId,
  isActive,
}: {
  entreprise: string;
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await toggleCompanyUserActive(entreprise, userId);
      setOpen(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Utilisateur désactivé" : "Utilisateur réactivé");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isActive ? "Désactiver" : "Réactiver"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isActive ? "Désactiver cet utilisateur ?" : "Réactiver cet utilisateur ?"}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? "Il ne pourra plus se connecter tant qu'il n'aura pas été réactivé. Toutes ses sessions actives seront immédiatement invalidées."
              : "Il pourra de nouveau se connecter normalement."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            variant={isActive ? "destructive" : "default"}
            disabled={isPending}
            onClick={handleConfirm}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
