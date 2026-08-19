"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCompanyUser, updateCompanyUser } from "@/server/company-admin/users";

type FormState = { success: boolean; error?: string } | null;

const roleOptions = [
  { value: "CLIENT", label: "Client" },
  { value: "COMPANY_ADMIN", label: "Admin d'entreprise" },
];

type CompanyUser = {
  id: string;
  name: string | null;
  email: string;
  role: "CLIENT" | "COMPANY_ADMIN";
};

export function CompanyUserDialog({
  entreprise,
  user,
  trigger,
}: {
  entreprise: string;
  user?: CompanyUser;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!user;
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user?.role ?? "CLIENT");

  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    return isEdit
      ? updateCompanyUser(entreprise, user.id, formData)
      : createCompanyUser(entreprise, formData);
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Utilisateur mis à jour" : "Utilisateur créé");
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
            {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour les informations de cet utilisateur."
              : "Crée un utilisateur dans ton entreprise."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} id="company-user-form" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Nom</Label>
            <Input id="user-name" name="name" defaultValue={user?.name ?? ""} required />
          </div>

          {!isEdit && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-password">Mot de passe</Label>
                <Input id="user-password" name="password" type="password" required />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-role">Rôle</Label>
            <Select name="role" value={role} onValueChange={(value) => setRole(value ?? "CLIENT")}>
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue>
                  {(value: string) => roleOptions.find((r) => r.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" form="company-user-form" disabled={isPending}>
            {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
