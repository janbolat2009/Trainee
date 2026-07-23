import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu, Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchLoaderProps {
  onComplete: () => void;
}

export const MatchLoader: React.FC<MatchLoaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  const stages = [
    'Initializing TRAINEE™ multi-dimensional vector matrix...',
    'Evaluating biomechanical specialization embeddings...',
    'Calculating coach style & scheduling compatibility scores...',
    'Synthesizing top recommendations with AI confidence metrics...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return prev;
        }
      });
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-24 flex flex-col items-center justify-center text-center px-4">
      
      {/* Animated Glowing AI Core */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-brand-accent/10 border border-brand-accent/40 flex items-center justify-center shadow-glow-accent animate-pulse">
          <Cpu className="w-12 h-12 text-brand-accent animate-spin-slow" />
        </div>
        <div className="absolute -inset-4 rounded-full border border-brand-accent/20 animate-ping opacity-30" />
      </div>

      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-accent mb-4">
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>NEURAL ENGINE ACTIVE</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-3">
        Calculating Your AI Coach Match
      </h2>

      <p className="text-xs sm:text-sm font-mono text-brand-muted max-w-md h-8">
        {stages[stage]}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1.5 bg-brand-border rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-brand-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${((stage + 1) / stages.length) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

    </div>
  );
};
