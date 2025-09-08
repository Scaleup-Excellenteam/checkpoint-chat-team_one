// Basic content inspection utilities for PII/secrets.
// Note: tune patterns and weights for your domain.

type sensitivity = 'low' | 'medium' | 'high';



export type DlpResult = {
  score: number;        // 0-100 (higher == riskier)
  reasons: string[];    // matched signals
  sensitive: sensitivity;  // likely contains sensitive data

};

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const creditCardRegex = /\b(?:\d[ -]*?){13,19}\b/; // simplified CC pattern
const ssnRegex = /\b\d{3}-?\d{2}-?\d{4}\b/;
const phoneRegex = /\+?[0-9]{1,3}?[-.\s(]*\d{2,4}[-.\s)]*\d{3,4}[-.\s]*\d{3,4}\b/;
const jwtRegex = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\b/; // looks like JWT
const awsAccessKeyId = /\bAKIA[0-9A-Z]{16}\b/;
const privateKeyBlock = /-----BEGIN (RSA|DSA|EC|PRIVATE) KEY-----[\s\S]*?-----END (RSA|DSA|EC|PRIVATE) KEY-----/;
const urlRegex = /\bhttps?:\/\/[^\s]+/i;
const base64Like = /\b([A-Za-z0-9+\/]{40,}=*)\b/;
const secretsWords = /\b(pass(word)?|api[_-]?key|secret|token|bearer|authorization)\b/i;
const rtlOverride = /[\u202A-\u202E]/; // bidi override chars

const patterns: [RegExp, number, string][] = [
  [privateKeyBlock, 90, 'private_key_block'],
  [awsAccessKeyId, 80, 'aws_access_key_id'],
  [jwtRegex, 70, 'jwt_like'],
  [ssnRegex, 70, 'ssn_like'],
  [creditCardRegex, 70, 'credit_card_like'],
  [emailRegex, 40, 'email'],
  [phoneRegex, 30, 'phone'],
  [urlRegex, 20, 'url'],
  [base64Like, 25, 'base64_like'],
  [secretsWords, 50, 'secrets_words'],
  [rtlOverride, 20, 'bidi_override'],
];

export function containsSensitiveData(text: unknown): boolean {
  if (typeof text !== "string") return true; // non-string content gets blocked
  const normalized = text.normalize("NFKC");
  return patterns.some(([re]) => re === privateKeyBlock ? re.test(normalized) : false);
}

export function assessContentRisk(text: unknown): DlpResult {
  const reasons: string[] = [];
  if (typeof text !== "string") {
    return { score: 100, reasons: ['non_string_content'], sensitive: 'high' };
  }
  const normalized = text.normalize("NFKC");

  let score = 0;

  // Pattern-based scoring
  for (const [re, weight, label] of patterns) {
    if (re.test(normalized)) {
      score += weight;
      reasons.push(label);
    }
  }

  // Length/entropy-ish heuristics
  const len = normalized.length;
  if (len > 4000) { score += 60; reasons.push('too_long_>4000'); }
  else if (len > 2000) { score += 30; reasons.push('long_>2000'); }

  // Repeated chars heuristic
  if (/(.)\1{10,}/.test(normalized)) { score += 15; reasons.push('repeated_chars'); }

  // Clamp
  if (score > 100) score = 100;

  const sensitive = containsSensitiveData(text);
  return { score, reasons, sensitive: sensitive ? 'high' : (score >= 50 ? 'medium' : 'low') };
}

export function basicSanitize(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, "").trim();
}

// Optional demo signal from your original file
export function looksLikeRecipe(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const normalized = text.normalize("NFKC");
  const bakingKeywords = /bake|oven|temperature|mix|dough|flour|sugar|butter|eggs|vanilla|chocolate/i;
  return bakingKeywords.test(normalized);
}