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
import { Label } from "@/components/ui/label";
import { setUserRole } from "@/server/admin/users";
import { isSuperAdmin, isCompanyAdmin } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

const roles = [
  { value: "CLIENT", label: "Client" },
  { value: "COMPANY_ADMIN", label: "Admin d'entreprise" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

function normalizedRole(role: Role): "CLIENT" | "COMPANY_ADMIN" | "SUPER_ADMIN" {
  if (isSuperAdmin(role)) return "SUPER_ADMIN";
  if (isCompanyAdmin(role)) return "COMPANY_ADMIN";
  return "CLIENT";
}

function labelFor(value: string) {
  return roles.find((r) => r.value === value)?.label ?? value;
}

export function RoleSelect({
  userId,
  role,
  companyId,
  companies,
}: {
  userId: string;
  role: Role;
  companyId: string | null;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const currentRole = normalizedRole(role);
  const [isPending, startTransition] = useTransition();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [pendingCompanyId, setPendingCompanyId] = useState<string>(companyId ?? "");

  const confirmChange = () => {
    if (!pendingRole) return;
    const nextRole = pendingRole as Role;

    if (nextRole === "COMPANY_ADMIN" && !pendingCompanyId) {
      toast.error("Choisis une entreprise.");
      return;
    }

    setPendingRole(null);

    startTransition(async () => {
      const result = await setUserRole(
        userId,
        nextRole,
        nextRole === "COMPANY_ADMIN" ? pendingCompanyId : undefined
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Rôle mis à jour");
      router.refresh();
    });
  };

  return (
    <>
      <Select
        value={currentRole}
        disabled={isPending}
        onValueChange={(value) => {
          if (value !== currentRole) {
            setPendingRole(value);
            setPendingCompanyId(companyId ?? "");
          }
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue>{(value: string) => labelFor(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le rôle de cet utilisateur ?</DialogTitle>
            <DialogDescription>
              Le rôle passera de « {labelFor(currentRole)} » à «{" "}
              {pendingRole ? labelFor(pendingRole) : ""} ». Toutes les
              sessions actives de ce compte seront immédiatement invalidées.
            </DialogDescription>
          </DialogHeader>

          {pendingRole === "COMPANY_ADMIN" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-picker">Entreprise</Label>
              <Select
                value={pendingCompanyId}
                onValueChange={(value) => setPendingCompanyId(value ?? "")}
              >
                <SelectTrigger id="company-picker" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      companies.find((c) => c.id === value)?.name ??
                      "Choisir une entreprise"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRole(null)}>
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
