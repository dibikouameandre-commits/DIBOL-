import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isOnAdmin = nextUrl.pathname.startsWith("/admin");
  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isOnAuthPage =
    nextUrl.pathname.startsWith("/connexion") ||
    nextUrl.pathname.startsWith("/inscription");

  if ((isOnAdmin || isOnDashboard) && !isLoggedIn) {
    const redirectUrl = new URL("/connexion", nextUrl.origin);
    redirectUrl.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isOnAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin" : "/dashboard", nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/connexion", "/inscription"],
};
