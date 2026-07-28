import { createClient } from 'npm:@supabase/supabase-js@2';

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
}

/**
 * Verifies the Bearer JWT from the Authorization header using Supabase Auth.
 * Returns the authenticated user or throws an error.
 *
 * This is the only way AI endpoints should accept requests — unauthenticated
 * calls are rejected with a 401 before any OpenAI token is consumed.
 */
export async function verifyUser(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header');
  }

  const token = authHeader.slice('Bearer '.length);

  // Build a client using the user's own JWT so Supabase validates it
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AuthError('Invalid or expired access token');
  }

  return { id: data.user.id, email: data.user.email };
}

/** Typed error class so callers can distinguish auth failures. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
