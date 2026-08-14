import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion?from=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}
