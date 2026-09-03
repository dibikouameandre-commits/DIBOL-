// JSON.stringify() never escapes "<", so a value like a product name or
// description containing "</script>" would close the tag early and let
// whatever follows execute as HTML/script. "<" is a valid JSON escape
// for "<" (JSON.parse reads it back unchanged), so this keeps the payload
// byte-identical while making that breakout impossible.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
