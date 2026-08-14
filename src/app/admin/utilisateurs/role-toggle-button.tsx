"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleUserRole } from "@/server/admin/users";

export function RoleToggleButton({
  userId,
  role,
}: {
  userId: string;
  role: "CLIENT" | "ADMIN";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleUserRole(userId);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Rôle mis à jour");
          router.refresh();
        });
      }}
    >
      {role === "ADMIN" ? "Rétrograder en client" : "Promouvoir admin"}
    </Button>
  );
}
