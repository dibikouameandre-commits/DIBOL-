import type { Metadata } from "next";
import { Plus } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCompanyAdmin } from "@/server/admin/guard";
import { getAllCompanyUsers } from "@/server/company-admin/users";
import { CompanyUserDialog } from "./user-dialog";
import { CompanyUserStatusButton } from "./user-status-button";

export const metadata: Metadata = { title: "Utilisateurs — Admin entreprise" };

export default async function CompanyUsersPage({
  params,
}: {
  params: Promise<{ entreprise: string }>;
}) {
  const { entreprise } = await params;
  const [users, { session }] = await Promise.all([
    getAllCompanyUsers(entreprise),
    requireCompanyAdmin(entreprise),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <CompanyUserDialog
          entreprise={entreprise}
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              Nouvel utilisateur
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucun utilisateur pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name ?? "—"}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "COMPANY_ADMIN" ? "default" : "outline"}>
                      {user.role === "COMPANY_ADMIN" ? "Admin d'entreprise" : "Client"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "outline" : "destructive"}>
                      {user.isActive ? "Actif" : "Désactivé"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count.orders}</TableCell>
                  <TableCell className="text-right">
                    {session.user.id !== user.id && (
                      <div className="flex items-center justify-end gap-2">
                        <CompanyUserDialog
                          entreprise={entreprise}
                          user={{
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role as "CLIENT" | "COMPANY_ADMIN",
                          }}
                          trigger={
                            <Button variant="ghost" size="sm">
                              Modifier
                            </Button>
                          }
                        />
                        <CompanyUserStatusButton
                          entreprise={entreprise}
                          userId={user.id}
                          isActive={user.isActive}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
