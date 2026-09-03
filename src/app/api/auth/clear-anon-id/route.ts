import { NextResponse } from "next/server";

import { clearAnonId, getRequestIpHash } from "@/lib/anon-id";

// Dedicated endpoint, no page render involved. It must NOT be a Server
// Action invoked from an authenticated page (e.g. /dashboard): that would
// re-run the page's own Server Components as part of the action's response,
// and if that happens concurrently with signOut()'s own request, next-auth's
// session-cookie refresh on that page re-render can land after signOut's
// cookie deletion and silently restore the session. A plain Route Handler
// with no auth check can't get entangled with that at all.

// This only rotates a cookie that has no value of its own (see
// clearAnonId()) — it doesn't warrant the Prisma-backed ToolRun rate
// limiter used for real quota/AI-abuse enforcement (src/lib/rate-limit.ts).
// A small in-memory, per-instance window is enough to stop a visitor from
// scripting repeated calls to force-rotate their anonId faster than a normal
// sign-out would ever need to; real generation is still capped separately
// by checkToolRateLimit's per-IP backstop regardless of how often anonId
// rotates.
const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 5;
const MAX_TRACKED_KEYS = 5000;
const recentCalls = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();

  if (recentCalls.size > MAX_TRACKED_KEYS) {
    for (const [k, timestamps] of recentCalls) {
      if (timestamps.every((t) => now - t >= WINDOW_MS)) recentCalls.delete(k);
    }
  }

  const timestamps = (recentCalls.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  recentCalls.set(key, timestamps);

  return timestamps.length > MAX_CALLS_PER_WINDOW;
}

export async function POST() {
  const ipHash = await getRequestIpHash();
  if (isRateLimited(ipHash)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  await clearAnonId();
  return NextResponse.json({ ok: true });
}
