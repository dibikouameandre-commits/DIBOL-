"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/generated/prisma/enums";
import { isCompanyAdmin, isSuperAdmin } from "@/lib/roles";

type AccountUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

function initials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "?";
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountMenu({
  user,
  companySlug,
}: {
  user: AccountUser;
  // Resolved server-side from the user's own companyId (see
  // getCompanySlugById) — never trust a slug from the current page's URL,
  // it may not be the company this user actually belongs to.
  companySlug?: string | null;
}) {
  const router = useRouter();
  const isCompanyAdminWithSlug = isCompanyAdmin(user.role) && !!companySlug;

  const dashboardHref = isSuperAdmin(user.role)
    ? "/admin"
    : isCompanyAdminWithSlug
      ? `/${companySlug}/admin`
      : "/dashboard";

  const isAdminSpace = isSuperAdmin(user.role) || isCompanyAdminWithSlug;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar>
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-medium">{user.name ?? "Mon compte"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={dashboardHref} />}>
            {isAdminSpace ? <ShieldCheck /> : <LayoutDashboard />}
            {isAdminSpace ? "Espace admin" : "Mon dashboard"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await signOut({ redirect: false });
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
