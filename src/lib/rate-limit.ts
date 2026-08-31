import { prisma } from "@/lib/prisma";
import { getToolBySlug } from "@/lib/tools/registry";
import { getExistingAnonId, getRequestIpHash } from "@/lib/anon-id";

const DAY_MS = 24 * 60 * 60 * 1000;

// A visitor can reset their per-anonId quota by clearing cookies — this
// backstop catches that case without punishing legitimate users who
// genuinely share an IP (common behind carrier-grade NAT on mobile
// networks, which a meaningful share of the target audience uses).
const IP_BACKSTOP_MULTIPLIER = 8;

export type RateLimitResult =
  | { allowed: true; remaining: number; limit: number }
  | { allowed: false; reason: "anon" | "ip"; limit: number };

export async function checkToolRateLimit(
  toolSlug: string,
  { anonId, ipHash }: { anonId: string; ipHash: string }
): Promise<RateLimitResult> {
  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolSlug}`);
  }

  const since = new Date(Date.now() - DAY_MS);

  const [byAnon, byIp] = await Promise.all([
    prisma.toolRun.count({
      where: { toolSlug, anonId, createdAt: { gte: since } },
    }),
    prisma.toolRun.count({
      where: { toolSlug, ipHash, createdAt: { gte: since } },
    }),
  ]);

  const limit = tool.dailyFreeLimit;

  if (byIp >= limit * IP_BACKSTOP_MULTIPLIER) {
    return { allowed: false, reason: "ip", limit };
  }

  if (byAnon >= limit) {
    return { allowed: false, reason: "anon", limit };
  }

  return { allowed: true, remaining: limit - byAnon, limit };
}

export type ToolQuotaStatus = { remaining: number; limit: number; blocked: boolean };

// Read-only, for display only (e.g. "il te reste 2 générations") — never
// used to gate a submission, and never itself changes the quota or the
// blocking rules. Reuses checkToolRateLimit's exact same counting/blocking
// logic, so this can never drift out of sync with the real enforcement.
// A visitor with no anonId cookie yet hasn't used any quota, so their
// status is trivially "full" without needing a DB read.
export async function getToolQuotaStatus(toolSlug: string): Promise<ToolQuotaStatus> {
  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolSlug}`);
  }

  const anonId = await getExistingAnonId();
  if (!anonId) {
    return { remaining: tool.dailyFreeLimit, limit: tool.dailyFreeLimit, blocked: false };
  }

  const ipHash = await getRequestIpHash();
  const result = await checkToolRateLimit(toolSlug, { anonId, ipHash });

  return result.allowed
    ? { remaining: result.remaining, limit: result.limit, blocked: false }
    : { remaining: 0, limit: result.limit, blocked: true };
}

// Called only after a successful generation — a failed AI call must never
// consume someone's daily quota.
export async function recordToolRun(
  toolSlug: string,
  {
    anonId,
    ipHash,
    userId,
  }: { anonId: string; ipHash: string; userId?: string }
) {
  return prisma.toolRun.create({
    data: { toolSlug, anonId, ipHash, userId },
  });
}
