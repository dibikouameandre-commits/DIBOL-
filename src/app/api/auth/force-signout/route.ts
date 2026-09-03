import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Breaks the /admin <-> /connexion redirect loop: a stale session cookie
// (tokenVersion/isActive mismatch, detected by auth.ts's jwt callback) can
// only be invalidated in Node, but the layout that detects it is a Server
// Component, which Next.js forbids from writing cookies — so the browser
// kept the same "still valid" cookie that middleware.ts (Edge, no DB
// access) would then bounce straight back to /admin. Route Handlers CAN
// write cookies, so redirecting here first clears it before the user ever
// lands back on /connexion.
//
// Deletes the cookie directly rather than calling next-auth's signOut(),
// which rebuilds an internal synthetic HTTP request out of this request's
// cloned headers (see next-auth/lib/actions.js) — that reconstruction
// returned a 400 "Bad request." in production while working locally,
// likely a Node-runtime-sensitive edge case in that internal request
// rebuilding. Deleting the cookie directly sidesteps that code path
// entirely instead of chasing the exact cause further.
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") ?? "/connexion";
  const cookieStore = await cookies();

  // Auth.js prefixes the cookie name with "__Secure-" over HTTPS
  // (production); no prefix over plain HTTP (local dev).
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");

  // Also clear the anonymous-visitor cookie: this is a session-ending path
  // like any other sign-out, and leaving it behind would let the next
  // account on this device inherit this session's tool history (see
  // clearAnonId() in src/lib/anon-id.ts).
  cookieStore.delete("dibol_anon_id");

  return NextResponse.redirect(
    new URL(`/connexion?from=${encodeURIComponent(from)}`, req.nextUrl.origin)
  );
}
