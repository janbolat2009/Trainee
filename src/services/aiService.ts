/**
 * aiService.ts — TRAINEE™ AI Frontend Service
 *
 * This is the ONLY file in the frontend that communicates with the AI backend.
 * It proxies all requests through Supabase Edge Functions so the OpenAI API key
 * is NEVER present in the browser or in frontend environment variables.
 *
 * Architecture:
 *   Browser → [this service] → Supabase Edge Function → OpenAI API
 */

import { supabase } from '../lib/supabase';
import type {
  Coach,
  Athlete,
  AIMatchmakingResponse,
  AIMatchedCoach,
  AICopilotResponse,
  CopilotConversationMessage,
} from '../types';

// ── Configuration ─────────────────────────────────────────────────────────────

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();

/** Build the Edge Function URL for a given function name. */
const edgeFunctionUrl = (name: string) => {
  if (!SUPABASE_URL) {
    throw new AIError('server', 'AI service is not configured for this environment.');
  }

  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/${name}`;
};

// ── Auth token helper ─────────────────────────────────────────────────────────

/**
 * Retrieves the current Supabase session access token.
 * This token is forwarded to Edge Functions as a Bearer JWT so they can
 * verify the user's identity without the frontend ever seeing the OpenAI key.
 */
async function getAccessToken(): Promise<string> {
  if (!supabase) throw new AIError('auth', 'Supabase client is not initialized.');

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new AIError(
      'auth',
      'You must be logged in to use AI features. Please sign in and try again.',
    );
  }
  return data.session.access_token;
}

// ── Error class ───────────────────────────────────────────────────────────────

export class AIError extends Error {
  type: 'auth' | 'rate_limit' | 'network' | 'parse' | 'server';
  resetAt?: string;

  constructor(
    type: AIError['type'],
    message: string,
    resetAt?: string,
  ) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.resetAt = resetAt;
  }
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

interface FetchAIOptions {
  functionName: string;
  body: Record<string, unknown>;
  token: string;
}

async function fetchEdgeFunction<T>(options: FetchAIOptions): Promise<T> {
  const { functionName, body, token } = options;

  let response: Response;
  try {
    response = await fetch(edgeFunctionUrl(functionName), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-client-info': 'trainee-app/1.0',
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new AIError(
      'network',
      'Could not reach the AI service. Check your internet connection, Supabase project status, and sign-in session.',
    );
  }

  // Handle rate limiting
  if (response.status === 429) {
    const resetAt = response.headers.get('X-RateLimit-Reset') ?? undefined;
    let message = 'You have exceeded the AI request limit. Please try again later.';
    try {
      const json = await response.json() as { error?: string };
      if (json.error) message = json.error;
    } catch { /* ignore parse error */ }
    throw new AIError('rate_limit', message, resetAt);
  }

  // Handle auth errors
  if (response.status === 401) {
    throw new AIError('auth', 'Your session is not authorized for AI features. Please sign in again and try once more.');
  }

  // Handle service errors
  if (!response.ok) {
    let message = `AI service error (HTTP ${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json.error) message = json.error;
    } catch { /* ignore */ }
    throw new AIError('server', message);
  }

  // Parse response
  try {
    return (await response.json()) as T;
  } catch {
    throw new AIError('parse', 'Received an unexpected response from the AI service.');
  }
}

// ── Slim helpers ──────────────────────────────────────────────────────────────

/** Strip a Coach object down to only the fields the AI needs (reduces token usage). */
function slimCoach(coach: Coach): Record<string, unknown> {
  return {
    id: coach.id,
    name: coach.name,
    title: coach.title,
    sport: coach.sport,
    secondarySports: coach.secondarySports,
    location: coach.location,
    isVerified: coach.isVerified,
    rating: coach.rating,
    reviewCount: coach.reviewCount,
    yearsExperience: coach.yearsExperience,
    athletesTrained: coach.athletesTrained,
    coachingStyle: coach.coachingStyle,
    hourlyRate: coach.hourlyRate,
    bio: coach.bio,
    achievements: coach.achievements,
    certifications: coach.certifications?.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      year: c.year,
    })),
    availability: coach.availability,
  };
}

/** Strip an Athlete profile down to matching-relevant fields. */
function slimAthlete(athlete: Athlete): Record<string, unknown> {
  return {
    name: athlete.name,
    age: athlete.age,
    sport: athlete.sport,
    specialization: athlete.specialization,
    skillLevel: athlete.skillLevel,
    location: athlete.location,
    budgetRange: athlete.budgetRange,
    goals: athlete.goals,
    achievements: athlete.achievements,
    bio: athlete.bio,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Runs AI matchmaking for an athlete against the provided coach pool.
 *
 * @param quizAnswers - Answers collected from the ConversationalQuiz
 * @param athleteProfile - The current authenticated athlete profile
 * @param coaches - The pool of coaches to evaluate (from coachesList context)
 * @returns Top-5 coaches enriched with AI compatibility analysis
 * @throws AIError on auth failure, rate limit, network error, or parse failure
 */
export async function runAIMatchmaking(
  quizAnswers: Record<string, string>,
  athleteProfile: Athlete,
  coaches: Coach[],
): Promise<AIMatchedCoach[]> {
  const token = await getAccessToken();

  const response = await fetchEdgeFunction<AIMatchmakingResponse>({
    functionName: 'ai-matchmaking',
    token,
    body: {
      quizAnswers,
      athleteProfile: slimAthlete(athleteProfile),
      coaches: coaches.map(slimCoach),
    },
  });

  if (!response.success || !Array.isArray(response.recommendations)) {
    throw new AIError('server', response.error ?? 'Matchmaking returned no results.');
  }

  // Merge AI recommendations back into the original Coach objects
  const coachMap = new Map(coaches.map((c) => [c.id, c]));
  const enriched: AIMatchedCoach[] = [];

  for (const rec of response.recommendations) {
    const coach = coachMap.get(rec.coachId);
    if (!coach) continue; // skip if AI returned an unknown id

    enriched.push({
      ...coach,
      matchScore: rec.matchScore,
      confidenceScore: rec.confidenceScore,
      compatibilitySummary: rec.compatibilitySummary,
      dimensionScores: rec.dimensionScores,
      matchReasons: rec.whyFits,
      disadvantages: rec.disadvantages,
      trainingExpectations: rec.trainingExpectations,
      successPotential: rec.successPotential,
    });
  }

  return enriched;
}

/**
 * Sends a message to the AI Copilot with full context injection.
 *
 * @param message - The user's current message
 * @param conversationHistory - Last N messages for continuity
 * @param userProfile - Current user's slim profile
 * @param userRole - 'athlete' | 'coach' | 'club'
 * @param pageContext - Current page, search query, active filters
 * @param availableCoaches - Coaches currently visible to the user
 * @returns AI response with message text and suggested follow-up prompts
 * @throws AIError on failure
 */
export async function sendCopilotMessage(
  message: string,
  conversationHistory: CopilotConversationMessage[],
  userProfile: Athlete | Coach | null,
  userRole: string,
  pageContext: {
    currentPage: string;
    searchQuery?: string;
    activeFilters?: Record<string, unknown>;
  },
  availableCoaches: Coach[] = [],
): Promise<AICopilotResponse> {
  const token = await getAccessToken();

  const profilePayload = userProfile
    ? {
        name: userProfile.name,
        age: 'age' in userProfile ? userProfile.age : undefined,
        sport: userProfile.sport,
        location: userProfile.location,
        bio: userProfile.bio,
        achievements: userProfile.achievements,
        // Athlete-specific
        ...('skillLevel' in userProfile && {
          specialization: userProfile.specialization,
          skillLevel: userProfile.skillLevel,
          budgetRange: userProfile.budgetRange,
          goals: userProfile.goals,
        }),
        // Coach-specific
        ...('coachingStyle' in userProfile && {
          coachingStyle: userProfile.coachingStyle,
          yearsExperience: userProfile.yearsExperience,
          hourlyRate: userProfile.hourlyRate,
        }),
      }
    : {};

  const response = await fetchEdgeFunction<AICopilotResponse>({
    functionName: 'ai-copilot',
    token,
    body: {
      message,
      conversationHistory,
      userProfile: profilePayload,
      userRole,
      pageContext,
      availableCoaches: availableCoaches.slice(0, 8).map((c) => ({
        name: c.name,
        sport: c.sport,
        coachingStyle: c.coachingStyle,
        hourlyRate: c.hourlyRate,
        availability: c.availability,
        rating: c.rating,
      })),
    },
  });

  if (!response.success) {
    throw new AIError('server', response.error ?? 'Copilot returned an error.');
  }

  return response;
}

/**
 * Pings the AI health endpoint to check if the AI backend is reachable.
 * Does not require authentication.
 * @returns true if the backend is online, false otherwise
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const res = await fetch(edgeFunctionUrl('ai-health'), { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Derives a user-facing error message from an AIError.
 * Safe to display directly in the UI.
 */
export function getAIErrorMessage(err: unknown): string {
  if (err instanceof AIError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred. Please try again.';
}
