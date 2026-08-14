"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setOrderStatus } from "@/server/admin/orders";

const statuses = [
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "CANCELED", label: "Annulée" },
  { value: "REFUNDED", label: "Remboursée" },
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          const result = await setOrderStatus(
            orderId,
            value as "PENDING" | "PAID" | "CANCELED" | "REFUNDED"
          );
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Statut mis à jour");
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue>
          {(value: string) => statuses.find((s) => s.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
