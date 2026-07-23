import React, { useState } from 'react';
import { Coach } from '../../types';
import { useApp } from '../../context/AppContext';
import { CompatibilityRing } from './CompatibilityRing';
import { ShieldCheck, Star, MapPin, Check, X, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardStackProps {
  matchedCoaches: Coach[];
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

  // Generate dynamic mock AI match reasons
  const matchReasons = currentCoach.matchReasons || [
    `100% alignment in ${currentCoach.sport} mechanics and high-acceleration programming.`,
    `Coaching methodology (${currentCoach.coachingStyle}) directly addresses your target goal.`,
    `Transparent fee (${currentCoach.hourlyRate}/hr) falls within your specified budget limit.`
  ];

  const score = currentCoach.matchScore || 98;

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

        {/* Why This Coach Fits You - AI Breakdown */}
        <div className="py-6 space-y-3">
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
