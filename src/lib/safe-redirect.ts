// Validates a `from` redirect target coming from a URL query param (attacker-
// controlled) so LoginForm/CompanyLoginForm never issue an open redirect.
// Only a same-origin relative path is accepted: must start with exactly one
// "/" (rejects "//evil.com" and "/\evil.com", both browser-parsed as
// protocol-relative) and contain no "://" (rejects things like
// "/redirect?to=https://evil.com" being misread, and absolute URLs smuggled
// past the leading slash check).
export function safeRedirectTarget(from: string | null): string | null {
  if (!from) return null;
  if (!from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) {
    return null;
  }
  if (from.includes("://")) return null;
  return from;
}
