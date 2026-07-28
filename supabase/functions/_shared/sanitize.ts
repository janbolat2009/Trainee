/**
 * Input sanitization utilities for Edge Functions.
 *
 * All user-supplied text must pass through these helpers before being
 * embedded in OpenAI prompts to prevent prompt injection attacks.
 */

/** Remove HTML tags and truncate a string to a safe length. */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/** Sanitize every string value inside a flat record. */
export function sanitizeRecord(
  obj: Record<string, unknown>,
  maxValueLength = 500,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 64);
    if (!safeKey) continue;
    if (typeof value === 'string') {
      result[safeKey] = sanitizeString(value, maxValueLength);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[safeKey] = String(value);
    } else if (Array.isArray(value)) {
      result[safeKey] = value
        .map((v) => sanitizeString(String(v), 200))
        .slice(0, 10)
        .join(', ');
    }
  }
  return result;
}

/**
 * Prompt injection detection.
 * Returns true if the text contains known adversarial patterns.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?previous\s+instructions?/i,
  /disregard\s+(?:the\s+)?(?:above|prior|previous)/i,
  /you\s+are\s+now\s+(?:a|an|the)/i,
  /act\s+as\s+(?:a|an|the)\s+\w/i,
  /pretend\s+(?:to\s+be|you\s+are)/i,
  /new\s+instructions?:/i,
  /override\s+(?:all\s+)?(?:safety|constraints?|rules?)/i,
  /<\|system\|>/i,
  /\[INST\]/i,
  /###\s*system/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /DAN\s+prompt/i,
];

export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Wrap user content in XML-style delimiters to separate it from instructions. */
export function wrapUserContent(label: string, content: string): string {
  return `<${label}>\n${content}\n</${label}>`;
}
