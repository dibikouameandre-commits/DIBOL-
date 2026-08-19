import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllUsers } from "@/server/admin/users";
import { getAllCompanies } from "@/server/admin/companies";
import { isSuperAdmin, isCompanyAdmin } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";
import { RoleSelect } from "./role-select";

function roleLabel(role: Role) {
  if (isSuperAdmin(role)) return "Admin";
  if (isCompanyAdmin(role)) return "Admin d'entreprise";
  return "Client";
}

export const metadata: Metadata = { title: "Utilisateurs — Admin" };

export default async function AdminUsersPage() {
  const [users, companies, session] = await Promise.all([
    getAllUsers(),
    getAllCompanies(),
    auth(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground">
          {users.length} utilisateur{users.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name ?? "—"}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={isSuperAdmin(user.role) ? "default" : "outline"}>
                    {roleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.company?.name ?? "—"}
                </TableCell>
                <TableCell>{user._count.orders}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                    user.createdAt
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {session?.user.id !== user.id && (
                    <RoleSelect
                      userId={user.id}
                      role={user.role}
                      companyId={user.companyId}
                      companies={companies}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
