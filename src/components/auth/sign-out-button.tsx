"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut({ redirect: false });
        router.push("/");
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}
