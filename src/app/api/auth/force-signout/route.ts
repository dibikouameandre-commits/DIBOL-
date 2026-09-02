import { NextRequest, NextResponse } from "next/server";

import { signOut } from "@/lib/auth";

// Breaks the /admin <-> /connexion redirect loop: a stale session cookie
// (tokenVersion/isActive mismatch, detected by auth.ts's jwt callback) can
// only be invalidated in Node, but the layout that detects it is a Server
// Component, which Next.js forbids from writing cookies — so the browser
// kept the same "still valid" cookie that middleware.ts (Edge, no DB
// access) would then bounce straight back to /admin. Route Handlers CAN
// write cookies, so redirecting here first lets signOut() actually clear
// it before the user ever lands back on /connexion.
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") ?? "/connexion";

  // `redirect: false` clears the session cookie without letting signOut()
  // compute its own redirect target — its internal URL resolution didn't
  // reliably track the actual request origin, so the redirect is built
  // here instead, the same way middleware.ts builds its own.
  await signOut({ redirect: false });

  return NextResponse.redirect(
    new URL(`/connexion?from=${encodeURIComponent(from)}`, req.nextUrl.origin)
  );
}
