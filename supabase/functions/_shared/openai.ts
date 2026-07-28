import OpenAI from 'npm:openai@4';

let _client: OpenAI | null = null;

/**
 * Returns a singleton OpenAI client configured with the server-side API key.
 * The key is sourced from `OPENAI_API_KEY` Supabase Edge Function secret.
 * It is NEVER exposed to the browser or included in frontend bundles.
 */
export function getOpenAIClient(): OpenAI {
  if (_client) return _client;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it via: supabase secrets set OPENAI_API_KEY=sk-...',
    );
  }

  _client = new OpenAI({
    apiKey,
    maxRetries: 2,
    timeout: 55_000, // 55 s — just under Supabase's 60 s function timeout
  });

  return _client;
}

/**
 * Helper to safely parse a JSON string, returning null on failure.
 * Used when extracting structured JSON from OpenAI completions.
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = text
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
