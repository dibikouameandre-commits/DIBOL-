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
import { RoleToggleButton } from "./role-toggle-button";

export const metadata: Metadata = { title: "Utilisateurs — Admin" };

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([getAllUsers(), auth()]);

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
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                    {user.role === "ADMIN" ? "Admin" : "Client"}
                  </Badge>
                </TableCell>
                <TableCell>{user._count.orders}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                    user.createdAt
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {session?.user.id !== user.id && (
                    <RoleToggleButton userId={user.id} role={user.role} />
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
