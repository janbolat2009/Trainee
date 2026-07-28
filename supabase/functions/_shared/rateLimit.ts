import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Rate limit configuration per endpoint.
 * These are the limits enforced per authenticated user per hour.
 */
const RATE_LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  matchmaking: { max: 5, windowMinutes: 60 },
  copilot: { max: 30, windowMinutes: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  max: number;
  remaining: number;
  resetAt: string; // ISO timestamp
}

/**
 * Checks and enforces per-user rate limits using the `ai_usage_logs` table.
 * Requires the SUPABASE_SERVICE_ROLE_KEY env var so it can bypass RLS.
 *
 * If the Supabase query fails (network error, table missing, etc.) the function
 * FAILS OPEN (allows the request) to avoid degrading the user experience.
 */
export async function checkAndConsumeRateLimit(
  userId: string,
  endpoint: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    return { allowed: true, used: 0, max: 999, remaining: 999, resetAt: new Date().toISOString() };
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000,
  ).toISOString();

  const resetAt = new Date(
    Date.now() + config.windowMinutes * 60 * 1000,
  ).toISOString();

  try {
    // Count existing calls in the window
    const { count, error: countError } = await serviceClient
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart);

    if (countError) {
      console.warn('[rateLimit] Count query failed, failing open:', countError.message);
      return { allowed: true, used: 0, max: config.max, remaining: config.max, resetAt };
    }

    const used = count ?? 0;
    const allowed = used < config.max;
    const remaining = Math.max(0, config.max - used - (allowed ? 1 : 0));

    if (allowed) {
      // Record this usage attempt
      const { error: insertError } = await serviceClient
        .from('ai_usage_logs')
        .insert({ user_id: userId, endpoint });

      if (insertError) {
        console.warn('[rateLimit] Insert failed:', insertError.message);
        // Fail open — the count check passed so we proceed anyway
      }
    }

    return { allowed, used, max: config.max, remaining, resetAt };
  } catch (err) {
    console.warn('[rateLimit] Unexpected error, failing open:', err);
    return { allowed: true, used: 0, max: config.max, remaining: config.max, resetAt };
  }
}

/** Build rate-limit headers to include in the response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.max),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt,
  };
}
