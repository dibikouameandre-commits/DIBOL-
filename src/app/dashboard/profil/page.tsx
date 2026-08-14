import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Profil",
};

export default async function ProfilPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>{session?.user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={session?.user?.name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Choisis un nouveau mot de passe pour ton compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
