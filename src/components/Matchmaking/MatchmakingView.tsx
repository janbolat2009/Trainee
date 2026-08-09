import React, { useState, useCallback } from 'react';
import { ConversationalQuiz } from './ConversationalQuiz';
import { MatchLoader } from './MatchLoader';
import { SwipeableCardStack } from './SwipeableCardStack';
import { Coach } from '../../types';
import type { AIMatchedCoach } from '../../types';
import { useApp } from '../../context/AppContext';
import { runAIMatchmaking, getAIErrorMessage, AIError } from '../../services/aiService';
import { AlertTriangle, Lock, Sparkles } from 'lucide-react';

type QuizState = 'quiz' | 'loading' | 'results' | 'error' | 'unauthenticated';

// ── Fallback scoring when AI is unavailable ────────────────────────────────────

function computeFallbackScores(
  coaches: Coach[],
  answers: Record<string, string>,
): AIMatchedCoach[] {
  const sportAnswer = answers['sport'] ?? '';
  const styleAnswer = answers['coachingStyle'] ?? '';

  return coaches
    .map((coach) => {
      let score = 82;
      if (coach.sport === sportAnswer) score += 10;
      if (coach.coachingStyle === styleAnswer) score += 5;
      if (coach.isVerified) score += 3;

      return {
        ...coach,
        matchScore: Math.min(score, 97),
        confidenceScore: 62,
        compatibilitySummary:
          `${coach.name} is a strong candidate based on sport and style alignment.`,
        dimensionScores: {
          sport: coach.sport === sportAnswer ? 90 : 70,
          skill: 80,
          goal: 78,
          style: coach.coachingStyle === styleAnswer ? 90 : 72,
          budget: 75,
          schedule: 80,
          experience: Math.min(60 + coach.yearsExperience * 2, 95),
          communication: 78,
          growth: 80,
          overall: Math.min(score, 97),
        },
        matchReasons: [
          `Specializes in ${coach.sport} with ${coach.yearsExperience} years of experience.`,
          `Coaching style (${coach.coachingStyle}) aligns with your preferences.`,
          `Hourly rate ($${coach.hourlyRate}/session) fits the typical athlete budget range.`,
        ],
        disadvantages: ['AI analysis temporarily unavailable — scores are estimated.'],
        trainingExpectations:
          'Expect structured sessions with progressive skill development over the first 30–60 days.',
        successPotential:
          'High potential based on initial profile compatibility. Full AI analysis recommended once service is restored.',
      } satisfies AIMatchedCoach;
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MatchmakingView: React.FC = () => {
  const {
    coachesList,
    isAuthenticated,
    selectedAthlete,
    setIsLoginOpen,
    subscription,
    aiMatchmakingUsageCount,
    incrementAiMatchmakingUsage,
    openPricingModal,
  } = useApp();

  const [quizState, setQuizState] = useState<QuizState>('quiz');
  const [matchedCoaches, setMatchedCoaches] = useState<AIMatchedCoach[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAIResult, setIsAIResult] = useState(true);
  const [loaderReady, setLoaderReady] = useState(false);

  // Called by MatchLoader when its animation finishes
  const handleLoaderComplete = useCallback(() => {
    setLoaderReady(true);
  }, []);

  // When quizState becomes 'results' AND loader is ready, we show results
  // We track this with a separate state so the loader animation can always finish
  const [pendingCoaches, setPendingCoaches] = useState<AIMatchedCoach[] | null>(null);

  React.useEffect(() => {
    if (loaderReady && pendingCoaches !== null) {
      setMatchedCoaches(pendingCoaches);
      setPendingCoaches(null);
      setQuizState('results');
    }
  }, [loaderReady, pendingCoaches]);

  const handleQuizComplete = async (answers: Record<string, string>) => {
    // Require authentication for AI matchmaking
    if (!isAuthenticated) {
      setQuizState('unauthenticated');
      return;
    }

    // Check Free tier AI Matchmaking limit (5 runs max)
    if (subscription.tier === 'free') {
      const { isLimitReached } = incrementAiMatchmakingUsage();
      if (isLimitReached || aiMatchmakingUsageCount >= 5) {
        openPricingModal('matchmaking_limit');
        return;
      }
    }

    setQuizState('loading');
    setLoaderReady(false);
    setIsAIResult(true);

    try {
      const results = await runAIMatchmaking(answers, selectedAthlete, coachesList);

      if (results.length === 0) {
        // AI returned no valid results — fall back gracefully
        throw new Error('No recommendations returned from AI.');
      }

      // Queue the results; they will be revealed after the loader finishes its animation
      setPendingCoaches(results);
    } catch (err) {
      const isRateLimit = err instanceof AIError && err.type === 'rate_limit';
      const isAuth = err instanceof AIError && err.type === 'auth';

      if (isAuth) {
        setQuizState('unauthenticated');
        return;
      }

      // For rate limits and server errors, fall back to algorithmic scoring
      const fallback = computeFallbackScores(coachesList, answers);
      setIsAIResult(false);

      if (isRateLimit) {
        setErrorMessage(getAIErrorMessage(err));
      } else {
        console.warn('[MatchmakingView] AI call failed, using fallback:', err);
        setErrorMessage('');
      }

      setPendingCoaches(fallback);
    }
  };

  const handleRestart = () => {
    setQuizState('quiz');
    setMatchedCoaches([]);
    setPendingCoaches(null);
    setLoaderReady(false);
    setErrorMessage('');
    setIsAIResult(true);
  };

  return (
    <div className="py-10 bg-brand-black min-h-screen pb-24 grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* View Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            AI Matchmaker Engine
          </h1>
          <p className="text-brand-muted text-sm">
            Powered by TRAINEE™ vector compatibility scoring across 10+ performance attributes.
          </p>
        </div>

        {/* State Flow */}

        {/* Unauthenticated gate */}
        {quizState === 'unauthenticated' && (
          <div className="max-w-md mx-auto mt-8">
            <div className="glass-panel p-8 rounded-3xl border border-brand-border text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center mx-auto text-brand-accent">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white uppercase">Sign In to Continue</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                AI Matchmaking is personalized to your athlete profile. Please log in to receive
                accurate, context-aware coach recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setQuizState('quiz')}
                  className="px-6 py-3 rounded-xl bg-brand-card border border-brand-border text-brand-muted hover:text-white text-xs font-bold uppercase transition"
                >
                  Back to Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {quizState === 'quiz' && (
          <ConversationalQuiz onQuizComplete={handleQuizComplete} />
        )}

        {quizState === 'loading' && (
          <MatchLoader onComplete={handleLoaderComplete} />
        )}

        {quizState === 'results' && (
          <>
            {/* Fallback / Rate-limit warning banner */}
            {(!isAIResult || errorMessage) && (
              <div className="max-w-xl mx-auto mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    {errorMessage || 'AI analysis is temporarily unavailable. Showing estimated compatibility scores.'}
                  </p>
                </div>
              </div>
            )}

            {/* AI-powered badge */}
            {isAIResult && (
              <div className="max-w-xl mx-auto mb-6 flex justify-center">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-brand-card border border-brand-border text-[10px] font-mono text-brand-accent uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Powered by GPT-4o · Real-time AI Analysis</span>
                </span>
              </div>
            )}

            <SwipeableCardStack matchedCoaches={matchedCoaches} onRestart={handleRestart} />
          </>
        )}

      </div>
    </div>
  );
};
