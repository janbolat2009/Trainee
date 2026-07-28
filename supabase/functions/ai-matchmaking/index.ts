/**
 * ai-matchmaking — TRAINEE™ AI Coach Matchmaking Engine
 *
 * POST /functions/v1/ai-matchmaking
 *
 * Requires: Authorization: Bearer <supabase-jwt>
 *
 * Body:
 * {
 *   quizAnswers: Record<string, string>;   // athlete answers from ConversationalQuiz
 *   athleteProfile: AthleteProfilePayload; // slim profile from frontend context
 *   coaches: CoachPayload[];               // available coaches from coachesList
 * }
 *
 * Returns top-5 coach recommendations with AI-generated compatibility analysis.
 * Uses gpt-4o at temperature=0.2 for maximum consistency and reliability.
 */

import { handleCors, jsonResponse, errorResponse, corsHeaders } from '../_shared/cors.ts';
import { verifyUser, AuthError } from '../_shared/auth.ts';
import { checkAndConsumeRateLimit, rateLimitHeaders } from '../_shared/rateLimit.ts';
import { getOpenAIClient, safeJsonParse } from '../_shared/openai.ts';
import {
  sanitizeString,
  sanitizeRecord,
  detectPromptInjection,
  wrapUserContent,
} from '../_shared/sanitize.ts';

// ── Type contracts (mirrors frontend types but kept lean) ─────────────────────

interface AthleteProfilePayload {
  name?: string;
  age?: number;
  sport?: string;
  specialization?: string;
  skillLevel?: string;
  location?: string;
  budgetRange?: string;
  goals?: string[];
  achievements?: string[];
  bio?: string;
}

interface CoachPayload {
  id: string;
  name: string;
  title?: string;
  sport?: string;
  secondarySports?: string[];
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  athletesTrained?: number;
  coachingStyle?: string;
  hourlyRate?: number;
  bio?: string;
  achievements?: string[];
  certifications?: { title: string; issuer: string; year: number }[];
  availability?: string;
}

interface DimensionScores {
  sport: number;
  skill: number;
  goal: number;
  style: number;
  budget: number;
  schedule: number;
  experience: number;
  communication: number;
  growth: number;
  overall: number;
}

interface CoachRecommendation {
  coachId: string;
  matchScore: number;
  confidenceScore: number;
  compatibilitySummary: string;
  dimensionScores: DimensionScores;
  whyFits: string[];
  disadvantages: string[];
  trainingExpectations: string;
  successPotential: string;
}

interface MatchmakingAIResponse {
  recommendations: CoachRecommendation[];
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are TRAINEE™ AI, an elite sports performance consultant with 25+ years of experience matching athletes with world-class coaches across all major sports disciplines. You have worked with Olympic programs, professional academies, and high-performance development centers globally.

Your sole mission in this task is to analyze the compatibility between one athlete and a roster of available coaches, then return structured JSON with your top 5 recommendations.

## EVALUATION DIMENSIONS
Evaluate each coach across ALL of the following dimensions (score 0–100):

1. **sport** — Primary and secondary sport alignment with athlete's discipline
2. **skill** — Does the coach's experience level and clientele match the athlete's current tier (Beginner/Intermediate/Advanced/Semi-Pro/Elite)?
3. **goal** — Do the coach's philosophy and achievements align with the athlete's short-term and long-term goals?
4. **style** — Coaching style preference match (Data-Driven / High Intensity / Holistic & Tactical / Mindset & Elite Performance / Technical Precision)
5. **budget** — Can the athlete realistically afford this coach's rates? Penalize heavily if not.
6. **schedule** — Availability match (Immediate / Limited Spots / Waitlist) and geographic proximity
7. **experience** — Coach's track record working with athletes at this level; professional achievements and certifications
8. **communication** — Communication style and language compatibility
9. **growth** — Long-term growth potential: can this coach develop the athlete over 2–3+ years?
10. **overall** — Weighted composite score (not a simple average; use expert judgment)

## SCORING RULES
- Base every score on specific evidence from the profiles provided. Do NOT assign arbitrary numbers.
- Budget compatibility: if the athlete's budget range is "Low" or "$50–$100" and the coach charges $200+/session, the budget score must be ≤ 30.
- Sport alignment: if the coach's primary sport does not match, cap the sport score at 60 (secondary sport alignment still applies but is weighted less).
- Verified coaches (isVerified: true) get a +3 to 5 point bonus in the experience dimension.
- Return ONLY the top 5 coaches sorted by matchScore descending.
- Do not hallucinate coach details. Only reference data explicitly provided.

## OUTPUT FORMAT
Return ONLY a valid JSON object with this exact structure (no markdown, no explanation outside JSON):

{
  "recommendations": [
    {
      "coachId": "<exact coach id from input>",
      "matchScore": <integer 0-100>,
      "confidenceScore": <integer 0-100>,
      "compatibilitySummary": "<2-3 sentence expert summary of why this is a strong match>",
      "dimensionScores": {
        "sport": <integer>,
        "skill": <integer>,
        "goal": <integer>,
        "style": <integer>,
        "budget": <integer>,
        "schedule": <integer>,
        "experience": <integer>,
        "communication": <integer>,
        "growth": <integer>,
        "overall": <integer>
      },
      "whyFits": ["<specific reason 1>", "<specific reason 2>", "<specific reason 3>"],
      "disadvantages": ["<realistic concern or limitation>"],
      "trainingExpectations": "<what the athlete can expect in their first 30-90 days>",
      "successPotential": "<honest assessment of how far this athlete can go with this coach>"
    }
  ]
}

Write your recommendations like an experienced sports consultant — specific, honest, evidence-based. Avoid generic phrases like "great fit" without justification.`;
}

function buildAthleteContext(
  profile: AthleteProfilePayload,
  quizAnswers: Record<string, string>,
): string {
  const goals = Array.isArray(profile.goals) ? profile.goals.join(', ') : 'Not specified';
  const achievements = Array.isArray(profile.achievements) ? profile.achievements.join(', ') : 'None listed';

  return `ATHLETE PROFILE:
- Name: ${profile.name ?? 'Unknown'}
- Age: ${profile.age ?? 'Unknown'}
- Sport: ${profile.sport ?? 'Unknown'}
- Specialization/Position: ${profile.specialization ?? 'Not specified'}
- Current Skill Level: ${profile.skillLevel ?? 'Unknown'}
- Location: ${profile.location ?? 'Unknown'}
- Budget Range: ${profile.budgetRange ?? 'Unknown'}
- Goals: ${goals}
- Achievements: ${achievements}
- Bio: ${profile.bio ?? 'No bio provided'}

QUIZ ANSWERS (athlete's self-reported preferences):
${Object.entries(quizAnswers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;
}

function buildCoachesContext(coaches: CoachPayload[]): string {
  return coaches.map((c) => {
    const certs = Array.isArray(c.certifications)
      ? c.certifications.map((cert) => `${cert.title} (${cert.issuer}, ${cert.year})`).join('; ')
      : 'None listed';
    const achievements = Array.isArray(c.achievements)
      ? c.achievements.join('; ')
      : 'None listed';
    const secondarySports = Array.isArray(c.secondarySports)
      ? c.secondarySports.join(', ')
      : 'None';

    return `---
Coach ID: ${c.id}
Name: ${c.name}
Title: ${c.title ?? 'Coach'}
Primary Sport: ${c.sport ?? 'Unknown'}
Secondary Sports: ${secondarySports}
Coaching Style: ${c.coachingStyle ?? 'Unknown'}
Location: ${c.location ?? 'Unknown'}
Hourly Rate: $${c.hourlyRate ?? 'Unknown'}/session
Availability: ${c.availability ?? 'Unknown'}
Verified: ${c.isVerified ? 'YES (verified by TRAINEE)' : 'No'}
Rating: ${c.rating ?? 'N/A'} (${c.reviewCount ?? 0} reviews)
Years Experience: ${c.yearsExperience ?? 'Unknown'}
Athletes Trained: ${c.athletesTrained ?? 'Unknown'}
Certifications: ${certs}
Achievements: ${achievements}
Bio: ${c.bio ?? 'No bio provided'}`;
  }).join('\n\n');
}

function normalizeDimensionScores(
  raw: Record<string, unknown> | undefined,
  fallback: Partial<DimensionScores> = {},
): DimensionScores {
  const keys: Array<keyof DimensionScores> = [
    'sport',
    'skill',
    'goal',
    'style',
    'budget',
    'schedule',
    'experience',
    'communication',
    'growth',
    'overall',
  ];

  const values = Object.fromEntries(
    keys.map((key) => {
      const rawValue = raw?.[key];
      const numeric = typeof rawValue === 'number'
        ? rawValue
        : Number(rawValue ?? fallback[key] ?? 70);
      return [key, Math.min(100, Math.max(0, Math.round(Number.isFinite(numeric) ? numeric : fallback[key] ?? 70)))];
    }),
  ) as DimensionScores;

  return values;
}

function buildFallbackRecommendations(
  coaches: CoachPayload[],
  profile: AthleteProfilePayload,
  quizAnswers: Record<string, unknown>,
): CoachRecommendation[] {
  const sportPreference = String(quizAnswers.sport ?? profile.sport ?? '').toLowerCase();
  const stylePreference = String(quizAnswers.coachingStyle ?? quizAnswers.style ?? '').toLowerCase();
  const budgetHint = String(profile.budgetRange ?? '').toLowerCase();
  const budgetCap = budgetHint.includes('low') || budgetHint.includes('$50') ? 120 : 250;

  return coaches.slice(0, 12).map((coach) => {
    const sportMatch = coach.sport?.toLowerCase().includes(sportPreference) || sportPreference.includes(coach.sport?.toLowerCase() ?? '');
    const styleMatch = coach.coachingStyle?.toLowerCase().includes(stylePreference) || stylePreference.includes(coach.coachingStyle?.toLowerCase() ?? '');
    const budgetFit = (coach.hourlyRate ?? 0) <= budgetCap;
    const verifiedBonus = coach.isVerified ? 6 : 0;
    let score = 72 + (sportMatch ? 10 : 0) + (styleMatch ? 6 : 0) + (budgetFit ? 6 : -4) + verifiedBonus;
    score += Math.min(8, (coach.yearsExperience ?? 0) / 3);

    return {
      coachId: coach.id,
      matchScore: Math.min(100, Math.max(0, Math.round(score))),
      confidenceScore: Math.min(100, Math.max(60, Math.round(70 + (coach.isVerified ? 8 : 0)))),
      compatibilitySummary: `${coach.name} is a strong fit based on sport alignment, coaching style, and budget fit.`,
      dimensionScores: {
        sport: sportMatch ? 90 : 72,
        skill: Math.min(95, 70 + (coach.yearsExperience ?? 0) / 2),
        goal: 74,
        style: styleMatch ? 90 : 72,
        budget: budgetFit ? 86 : 58,
        schedule: 76,
        experience: Math.min(95, 70 + verifiedBonus + (coach.yearsExperience ?? 0) / 2),
        communication: 74,
        growth: 78,
        overall: Math.min(100, Math.max(0, Math.round(score))),
      },
      whyFits: [
        sportMatch ? `Strong sport alignment with ${coach.sport ?? 'your discipline'}` : `Relevant coaching background in ${coach.sport ?? 'the requested field'}`,
        styleMatch ? `Coaching style matches your stated preferences` : 'Balanced coaching approach for development planning',
        budgetFit ? 'Pricing stays within a realistic range for your budget' : 'Pricing is above the usual range, so it may require more planning',
      ],
      disadvantages: coach.hourlyRate && coach.hourlyRate > budgetCap
        ? ['Pricing is above the typical budget range.']
        : ['Availability may be limited depending on the current roster.'],
      trainingExpectations: 'Expect a structured onboarding phase with clear goals, feedback, and a practical first-month plan.',
      successPotential: 'High potential for progression if the coach can support your immediate goals and long-term development path.',
    } satisfies CoachRecommendation;
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const startTime = Date.now();

  // ── 1. Authentication ───────────────────────────────────────────────────────
  let user: { id: string; email: string | undefined };
  try {
    user = await verifyUser(req);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, 401);
    return errorResponse('Authentication failed', 401);
  }

  // ── 2. Rate limiting ────────────────────────────────────────────────────────
  const rateResult = await checkAndConsumeRateLimit(user.id, 'matchmaking');
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Rate limit exceeded. You can run up to ${rateResult.max} AI matches per hour. Try again after ${new Date(rateResult.resetAt).toLocaleTimeString()}.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rateResult),
        },
      },
    );
  }

  // ── 3. Parse + validate request body ───────────────────────────────────────
  let body: {
    quizAnswers?: Record<string, unknown>;
    athleteProfile?: Record<string, unknown>;
    coaches?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Request body must be valid JSON', 400);
  }

  const rawQuizAnswers = body.quizAnswers ?? {};
  const rawAthleteProfile = body.athleteProfile ?? {};
  const rawCoaches = Array.isArray(body.coaches) ? body.coaches : [];

  if (rawCoaches.length === 0) {
    return errorResponse('No coaches provided for matching', 400);
  }

  // ── 4. Sanitize inputs ──────────────────────────────────────────────────────
  const quizAnswers = sanitizeRecord(rawQuizAnswers as Record<string, unknown>, 200);
  const athleteProfile = sanitizeRecord(rawAthleteProfile as Record<string, unknown>, 500);

  // Check for prompt injection in free-text fields
  const textToCheck = Object.values(quizAnswers).join(' ') + ' ' +
    Object.values(athleteProfile).join(' ');
  if (detectPromptInjection(textToCheck)) {
    console.warn(`[ai-matchmaking] Prompt injection attempt detected from user ${user.id}`);
    return errorResponse('Invalid input detected. Please use the official quiz interface.', 400);
  }

  // Sanitize and slim down coach data to reduce token usage
  const coaches = rawCoaches.slice(0, 20).map((c) => {
    const coach = c as Record<string, unknown>;
    return {
      id: sanitizeString(String(coach.id ?? ''), 64),
      name: sanitizeString(String(coach.name ?? ''), 100),
      title: sanitizeString(String(coach.title ?? ''), 150),
      sport: sanitizeString(String(coach.sport ?? ''), 50),
      secondarySports: Array.isArray(coach.secondarySports)
        ? (coach.secondarySports as string[]).map((s) => sanitizeString(s, 50)).slice(0, 5)
        : [],
      location: sanitizeString(String(coach.location ?? ''), 100),
      isVerified: Boolean(coach.isVerified),
      rating: typeof coach.rating === 'number' ? coach.rating : 0,
      reviewCount: typeof coach.reviewCount === 'number' ? coach.reviewCount : 0,
      yearsExperience: typeof coach.yearsExperience === 'number' ? coach.yearsExperience : 0,
      athletesTrained: typeof coach.athletesTrained === 'number' ? coach.athletesTrained : 0,
      coachingStyle: sanitizeString(String(coach.coachingStyle ?? ''), 60),
      hourlyRate: typeof coach.hourlyRate === 'number' ? coach.hourlyRate : 0,
      bio: sanitizeString(String(coach.bio ?? ''), 400),
      achievements: Array.isArray(coach.achievements)
        ? (coach.achievements as string[]).map((a) => sanitizeString(a, 150)).slice(0, 5)
        : [],
      certifications: Array.isArray(coach.certifications)
        ? (coach.certifications as Record<string, unknown>[]).slice(0, 5).map((cert) => ({
            title: sanitizeString(String(cert.title ?? ''), 100),
            issuer: sanitizeString(String(cert.issuer ?? ''), 80),
            year: typeof cert.year === 'number' ? cert.year : 0,
          }))
        : [],
      availability: sanitizeString(String(coach.availability ?? ''), 30),
    } as CoachPayload;
  });

  // Reconstruct typed profile from sanitized record
  const profile: AthleteProfilePayload = {
    name: athleteProfile.name,
    age: typeof rawAthleteProfile.age === 'number' ? rawAthleteProfile.age : undefined,
    sport: athleteProfile.sport,
    specialization: athleteProfile.specialization,
    skillLevel: athleteProfile.skillLevel ?? athleteProfile.skill_level,
    location: athleteProfile.location,
    budgetRange: athleteProfile.budgetRange ?? athleteProfile.budget_range,
    goals: Array.isArray(rawAthleteProfile.goals)
      ? (rawAthleteProfile.goals as unknown[]).map((g) => sanitizeString(String(g), 150)).slice(0, 8)
      : [],
    achievements: Array.isArray(rawAthleteProfile.achievements)
      ? (rawAthleteProfile.achievements as unknown[]).map((a) => sanitizeString(String(a), 150)).slice(0, 8)
      : [],
    bio: athleteProfile.bio,
  };

  // ── 5. Build prompts ────────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userMessage = [
    'Analyze the following athlete-coach compatibility and return your top 5 recommendations as JSON.',
    '',
    wrapUserContent('ATHLETE', buildAthleteContext(profile, quizAnswers)),
    '',
    wrapUserContent('AVAILABLE_COACHES', buildCoachesContext(coaches)),
    '',
    'Return ONLY the JSON object. No markdown. No explanation outside the JSON.',
  ].join('\n');

  // ── 6. Call OpenAI gpt-4o ───────────────────────────────────────────────────
  let aiResponseText: string;
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    aiResponseText = completion.choices[0]?.message?.content ?? '';

    console.log(
      `[ai-matchmaking] user=${user.id} coaches=${coaches.length} ` +
      `tokens=${completion.usage?.total_tokens ?? '?'} ` +
      `latency=${Date.now() - startTime}ms`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown OpenAI error';
    console.error(`[ai-matchmaking] OpenAI call failed: ${message}`);
    return errorResponse('AI service temporarily unavailable. Please try again in a moment.', 503);
  }

  // ── 7. Parse + validate response ────────────────────────────────────────────
  const parsed = safeJsonParse<MatchmakingAIResponse>(aiResponseText);
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    console.error('[ai-matchmaking] Failed to parse AI response:', aiResponseText.slice(0, 500));
    return errorResponse('AI returned an unexpected response format. Please retry.', 502);
  }

  // Clamp scores to valid ranges and ensure coach IDs exist in our input set
  const validCoachIds = new Set(coaches.map((c) => c.id));
  let recommendations = parsed.recommendations
    .filter((r) => validCoachIds.has(r.coachId))
    .map((r) => ({
      ...r,
      matchScore: Math.min(100, Math.max(0, Math.round(r.matchScore))),
      confidenceScore: Math.min(100, Math.max(0, Math.round(r.confidenceScore))),
      dimensionScores: normalizeDimensionScores(r.dimensionScores as Record<string, unknown> | undefined),
      whyFits: (r.whyFits ?? []).slice(0, 5),
      disadvantages: (r.disadvantages ?? []).slice(0, 3),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (recommendations.length < 3) {
    const fallbackRecommendations = buildFallbackRecommendations(coaches, profile, quizAnswers);
    const existingIds = new Set(recommendations.map((r) => r.coachId));

    recommendations = [
      ...recommendations,
      ...fallbackRecommendations.filter((r) => !existingIds.has(r.coachId)),
    ]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  // ── 8. Return response ──────────────────────────────────────────────────────
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    ...rateLimitHeaders(rateResult),
  };

  return new Response(
    JSON.stringify({
      success: true,
      recommendations,
      meta: {
        processingTimeMs: Date.now() - startTime,
        model: 'gpt-4o',
        coachesAnalyzed: coaches.length,
        rateLimitRemaining: rateResult.remaining,
      },
    }),
    { status: 200, headers: responseHeaders },
  );
});
