import React, { useState } from 'react';
import { ConversationalQuiz } from './ConversationalQuiz';
import { MatchLoader } from './MatchLoader';
import { SwipeableCardStack } from './SwipeableCardStack';
import { MOCK_COACHES } from '../../data/mockData';
import { Coach } from '../../types';

export const MatchmakingView: React.FC = () => {
  const [quizState, setQuizState] = useState<'quiz' | 'loading' | 'results'>('quiz');
  const [matchedCoaches, setMatchedCoaches] = useState<Coach[]>([]);

  const handleQuizComplete = (answers: Record<string, string>) => {
    setQuizState('loading');

    // Dynamically calculate compatibility scores based on quiz answers
    setTimeout(() => {
      const sportAnswer = answers['sport'] || 'Track & Field';
      const styleAnswer = answers['coachingStyle'] || 'Data-Driven';

      const scored = MOCK_COACHES.map((coach) => {
        let score = 85;
        if (coach.sport === sportAnswer) score += 9;
        if (coach.coachingStyle === styleAnswer) score += 5;
        if (coach.isVerified) score += 3;

        return {
          ...coach,
          matchScore: Math.min(score, 99),
          matchReasons: [
            `100% alignment in ${coach.sport} specialization and technique refinement.`,
            `Coaching philosophy (${coach.coachingStyle}) directly satisfies your performance requirements.`,
            `Hourly rate ($${coach.hourlyRate}) aligns transparently with your selected budget.`
          ]
        };
      }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setMatchedCoaches(scored);
    }, 500);
  };

  const handleRestart = () => {
    setQuizState('quiz');
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
            Powered by TRAINEE™ vector compatibility scoring across 20+ performance attributes.
          </p>
        </div>

        {/* State Flow */}
        {quizState === 'quiz' && (
          <ConversationalQuiz onQuizComplete={handleQuizComplete} />
        )}

        {quizState === 'loading' && (
          <MatchLoader onComplete={() => setQuizState('results')} />
        )}

        {quizState === 'results' && (
          <SwipeableCardStack matchedCoaches={matchedCoaches} onRestart={handleRestart} />
        )}

      </div>
    </div>
  );
};
