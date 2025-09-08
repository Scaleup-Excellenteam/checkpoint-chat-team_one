// Basic content inspection utilities for PII/secrets.
// Note: tune patterns as needed for your domain.

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const creditCardRegex = /\b(?:\d[ -]*?){13,19}\b/; // simplified CC pattern
const ssnRegex = /\b\d{3}-?\d{2}-?\d{4}\b/;
const phoneRegex = /\+?[0-9]{1,3}?[-.\s(]*\d{2,4}[-.\s)]*\d{3,4}[-.\s]*\d{3,4}\b/;
const jwtRegex = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\b/; // looks like JWT
const awsAccessKeyId = /\bAKIA[0-9A-Z]{16}\b/;
const privateKeyBlock = /-----BEGIN (RSA|DSA|EC|PRIVATE) KEY-----[\s\S]*?-----END (RSA|DSA|EC|PRIVATE) KEY-----/;

const patterns: RegExp[] = [
  emailRegex,
  creditCardRegex,
  ssnRegex,
  phoneRegex,
  jwtRegex,
  awsAccessKeyId,
  privateKeyBlock,
];

export function containsSensitiveData(text: unknown): boolean {
  if (typeof text !== "string") return true; // non-string content gets blocked
  const normalized = text.normalize("NFKC");
  return patterns.some((re) => re.test(normalized));
}

export function basicSanitize(text: unknown): string {
  if (typeof text !== "string") {
    return "";
  }
  // Strip HTML tags to reduce XSS risk if you ever render this content
  return text.replace(/<[^>]*>/g, "").trim();
}

// probabilitic check if text looks like (baking recipe)
export function looksLikeRecipe(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const normalized = text.normalize("NFKC");
  // Check for keywords commonly found in baking recipes
  const bakingKeywords = /bake|oven|temperature|mix|dough|flour|sugar|butter|eggs|vanilla|chocolate/i; // add more as needed
  // Simple keyword-based check
  return bakingKeywords.test(normalized);
}