import { randomBytes, createHash } from "crypto";

export function generateRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

// Short, unguessable id for a shareable URL (ToolResult.shareSlug) — shorter
// than generateRawToken() on purpose, since this one ends up in a link
// people actually paste into WhatsApp/Facebook.
export function generateShareSlug() {
  return randomBytes(8).toString("hex");
}

// Never store a raw IP address — only this hash, just enough to count
// requests per-IP for the tool-usage rate limit without keeping directly
// identifying data.
export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}
