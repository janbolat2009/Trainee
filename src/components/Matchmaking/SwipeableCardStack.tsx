import React, { useState } from 'react';
import type { AIMatchedCoach } from '../../types';
import { useApp } from '../../context/AppContext';
import { CompatibilityRing } from './CompatibilityRing';
import { ShieldCheck, Star, MapPin, Check, X, ArrowRight, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardStackProps {
  matchedCoaches: AIMatchedCoach[];
  onRestart: () => void;
}

export const SwipeableCardStack: React.FC<CardStackProps> = ({ matchedCoaches, onRestart }) => {
  const { viewCoachDetails } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connectedCoachIds, setConnectedCoachIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentCoach = matchedCoaches[currentIndex];

  const handleNext = (action: 'connect' | 'pass') => {
    if (action === 'connect' && currentCoach) {
      setConnectedCoachIds((prev) => [...prev, currentCoach.id]);
      setActionNotice(`Connected with ${currentCoach.name}! Request sent.`);
    } else if (action === 'pass' && currentCoach) {
      setActionNotice(`Passed on ${currentCoach.name}`);
    }

    setTimeout(() => {
      setActionNotice(null);
      if (currentIndex < matchedCoaches.length) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  if (!currentCoach || currentIndex >= matchedCoaches.length) {
    return (
      <div className="glass-panel p-10 rounded-3xl border border-brand-border text-center space-y-6 max-w-md mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-brand-accent/20 border border-brand-accent flex items-center justify-center mx-auto text-brand-accent shadow-glow-accent">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-extrabold text-white uppercase">You've Reviewed All Matches!</h3>
        <p className="text-xs text-brand-muted leading-relaxed">
          You connected with <strong className="text-white font-mono">{connectedCoachIds.length}</strong> matched coaches. They have received your athletic profile overview.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onRestart}
            className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white"
          >
            Run New AI Match Quiz
          </button>
        </div>
      </div>
    );
  }

  const matchReasons = currentCoach.matchReasons?.length
    ? currentCoach.matchReasons
    : [
        `${currentCoach.sport} specialist with ${currentCoach.yearsExperience} years of coaching experience.`,
        `Coaching methodology (${currentCoach.coachingStyle}) aligns with your training preferences.`,
        `Hourly rate ($${currentCoach.hourlyRate}/session) is within the standard range.`,
      ];

  const score = currentCoach.matchScore ?? 85;
  const confidence = currentCoach.confidenceScore ?? 0;
  const summary = currentCoach.compatibilitySummary ?? '';
  const disadvantages = currentCoach.disadvantages ?? [];
  const trainingExpectations = currentCoach.trainingExpectations ?? '';
  const successPotential = currentCoach.successPotential ?? '';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Notice Banner */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-mono text-center font-bold"
          >
            {actionNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Matched Coach Card */}
      <motion.div
        key={currentCoach.id}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-brand-border shadow-2xl relative overflow-hidden"
      >
        {/* Top Header & Compatibility Score */}
        <div className="flex items-start justify-between pb-6 border-b border-brand-border/60">
          <div className="flex items-center space-x-4">
            <img 
              src={currentCoach.avatar} 
              alt={currentCoach.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-border"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-lg sm:text-xl">{currentCoach.name}</h3>
                {currentCoach.isVerified && (
                  <ShieldCheck className="w-5 h-5 text-brand-accent fill-brand-accent/20" />
                )}
              </div>
              <span className="text-xs text-brand-accent font-mono font-bold block mt-0.5">{currentCoach.title}</span>
              <div className="flex items-center space-x-2 text-xs text-brand-muted mt-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{currentCoach.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <CompatibilityRing score={score} size={64} strokeWidth={5} />
            <span className="text-[9px] font-mono text-brand-muted uppercase mt-1">AI SCORE</span>
          </div>
        </div>

        {/* AI Compatibility Summary */}
        {summary && (
          <div className="mt-4 p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-xs text-zinc-200 leading-relaxed">
            <span className="text-brand-accent font-mono font-bold">AI: </span>{summary}
          </div>
        )}

        {/* Confidence + Dimension Scores */}
        {confidence > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-mono text-brand-muted uppercase">Confidence</span>
            <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-brand-accent font-bold">{confidence}%</span>
          </div>
        )}

        {/* Why This Coach Fits You - AI Breakdown */}
        <div className="py-4 space-y-3">
          <div className="text-xs font-mono uppercase text-brand-accent flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why This Match Fits Your Profile</span>
          </div>

          <div className="space-y-2">
            {matchReasons.map((reason, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-brand-dark border border-brand-border/60 text-xs text-zinc-300 flex items-start space-x-2.5">
                <span className="text-brand-accent font-bold font-mono">✓</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disadvantages */}
        {disadvantages.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Potential Considerations</span>
            </div>
            {disadvantages.map((d, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-amber-400/5 border border-amber-400/20 text-xs text-amber-200/80 flex items-start space-x-2">
                <span className="text-amber-400 font-bold">!</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}

        {/* Training Expectations & Success Potential */}
        {(trainingExpectations || successPotential) && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {trainingExpectations && (
              <div className="p-3 rounded-xl bg-brand-dark border border-brand-border/60 space-y-1">
                <div className="text-[10px] font-mono uppercase text-brand-muted">Training Expectations</div>
                <p className="text-xs text-zinc-300 leading-relaxed">{trainingExpectations}</p>
              </div>
            )}
            {successPotential && (
              <div className="p-3 rounded-xl bg-brand-dark border border-brand-border/60 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Success Potential</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{successPotential}</p>
              </div>
            )}
          </div>
        )}

        {/* Pricing & Details Link */}
        <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase text-brand-muted font-mono">Rate Package</div>
            <div className="text-lg font-bold text-white font-mono">
              ${currentCoach.hourlyRate} <span className="text-xs font-normal text-brand-muted">/ session</span>
            </div>
          </div>

          <button
            onClick={() => viewCoachDetails(currentCoach)}
            className="px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-xs font-bold text-white hover:bg-white/10 transition flex items-center space-x-1.5"
          >
            <span>View Full Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swipe / Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-brand-border/60">
          <button
            onClick={() => handleNext('pass')}
            className="py-3.5 rounded-xl bg-brand-card border border-brand-border text-brand-muted hover:text-white hover:border-zinc-600 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Pass Match</span>
          </button>

          <button
            onClick={() => handleNext('connect')}
            className="py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition flex items-center justify-center space-x-2 shadow-glow-white"
          >
            <Check className="w-4 h-4 text-black stroke-[3]" />
            <span>Connect & Request</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
