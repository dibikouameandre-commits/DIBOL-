import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";

import { hashIp } from "@/lib/tokens";

const COOKIE_NAME = "dibol_anon_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Identifies an anonymous visitor across requests so free tools work
// without an account, while still giving the rate limiter something
// per-visitor to count against. Not meant to be tamper-proof on its own —
// see src/lib/rate-limit.ts's IP backstop for what actually stops someone
// from just clearing cookies to reset their quota.
export async function getOrCreateAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}

// Read-only sibling of getOrCreateAnonId() — for display purposes (e.g.
// showing remaining quota on a plain page render), where we must NOT set a
// cookie: Next.js only allows cookies().set() inside a Server Action or
// Route Handler, never during a normal page render. A visitor with no
// cookie yet is, by definition, one who hasn't used any quota — callers
// should treat `null` as "full quota", not try to create an id here.
export async function getExistingAnonId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// Vercel sets x-forwarded-for; never store the raw value, only its hash
// (see hashIp) — this is a rate-limit signal, not an identity record.
export async function getRequestIpHash(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return hashIp(ip);
}
