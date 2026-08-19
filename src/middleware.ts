import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";
import { isSuperAdmin, isCompanyAdmin } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isOnAdmin = nextUrl.pathname.startsWith("/admin");
  const isOnCompanyAdmin = /^\/[^/]+\/admin(\/|$)/.test(nextUrl.pathname);
  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnAuthPage =
    nextUrl.pathname.startsWith("/connexion") ||
    nextUrl.pathname.startsWith("/inscription");

  if ((isOnAdmin || isOnCompanyAdmin || isOnDashboard) && !isLoggedIn) {
    const redirectUrl = new URL("/connexion", nextUrl.origin);
    redirectUrl.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isOnAdmin && (!role || !isSuperAdmin(role))) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Coarse check only — this can't verify the requested company slug
  // actually matches the signed-in COMPANY_ADMIN's own company (that needs
  // a database lookup, unavailable in this Edge middleware). The real,
  // per-company authorization happens in requireCompanyAdmin() on every
  // page and server action.
  if (
    isOnCompanyAdmin &&
    (!role || !(isSuperAdmin(role) || isCompanyAdmin(role)))
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL(role && isSuperAdmin(role) ? "/admin" : "/dashboard", nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/connexion",
    "/inscription",
    "/:entreprise/admin/:path*",
  ],
};
