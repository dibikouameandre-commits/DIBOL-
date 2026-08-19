"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setCompanyOrderStatus } from "@/server/company-admin/orders";

const statuses = [
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "CANCELED", label: "Annulée" },
  { value: "REFUNDED", label: "Remboursée" },
];

function labelFor(value: string) {
  return statuses.find((s) => s.value === value)?.label ?? value;
}

export function CompanyOrderStatusSelect({
  entreprise,
  orderId,
  status,
}: {
  entreprise: string;
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const confirmChange = () => {
    if (!pendingStatus) return;
    const nextStatus = pendingStatus;
    setPendingStatus(null);

    startTransition(async () => {
      const result = await setCompanyOrderStatus(
        entreprise,
        orderId,
        nextStatus as "PENDING" | "PAID" | "CANCELED" | "REFUNDED"
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Statut mis à jour");
      router.refresh();
    });
  };

  return (
    <>
      <Select
        value={status}
        disabled={isPending}
        onValueChange={(value) => {
          if (value !== status) setPendingStatus(value);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue>{(value: string) => labelFor(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut de la commande ?</DialogTitle>
            <DialogDescription>
              Le statut passera de « {labelFor(status)} » à «{" "}
              {pendingStatus ? labelFor(pendingStatus) : ""} ».
              {pendingStatus === "PAID" &&
                " Un email de confirmation sera envoyé au client."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>
              Annuler
            </Button>
            <Button disabled={isPending} onClick={confirmChange}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
