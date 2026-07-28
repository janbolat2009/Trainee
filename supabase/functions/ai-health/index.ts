import { handleCors, jsonResponse } from '../_shared/cors.ts';

/**
 * ai-health — Public health-check endpoint.
 *
 * GET /functions/v1/ai-health
 *
 * No authentication required. Used by the frontend to detect whether
 * the AI backend is reachable before enabling AI-powered features.
 */
Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  return jsonResponse({
    success: true,
    status: 'ok',
    service: 'TRAINEE™ AI Backend',
    timestamp: new Date().toISOString(),
  });
});
