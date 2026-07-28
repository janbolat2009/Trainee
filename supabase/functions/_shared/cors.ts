/**
 * Shared CORS headers for all TRAINEE™ Edge Functions.
 * In production you should restrict `Access-Control-Allow-Origin`
 * to your deployed domain (e.g. 'https://trainee.app').
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Return a preflight response for OPTIONS requests. */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

/** Wrap a JSON payload with standard headers. */
export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Wrap an error into a structured JSON error response. */
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ success: false, error: message }, status);
}
