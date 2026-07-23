import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Activity, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  const { setActiveTab, setIsOnboardingOpen } = useApp();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 grid-bg border-b border-brand-border/50">
      
      {/* Glow gradient blobs background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -top-24 right-10 w-[350px] h-[350px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Main Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-light"
            >
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-zinc-300">NEXT-GEN ATHLETIC PERFORMANCE</span>
              <span className="text-brand-muted">•</span>
              <span className="text-brand-accent font-semibold">AI MATRIX 2.0</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.08] font-sans"
            >
              Train With The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                Top 1% Of Coaches.
              </span> <br />
              <span className="text-brand-accent font-mono tracking-tight font-extrabold text-3xl sm:text-4xl lg:text-5xl block mt-2">
                Matched By AI.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-brand-muted max-w-2xl font-normal leading-relaxed"
            >
              TRAINEE™ uses multi-dimensional vector matching to connect ambitious athletes with elite verified sports coaches. Biomechanics, tactical IQ, and personality alignment—calculated in seconds.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2"
            >
              <button
                onClick={() => setActiveTab('matchmaking')}
                className="px-7 py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 shadow-glow-white"
              >
                <Sparkles className="w-4 h-4 text-black fill-black" />
                <span>Find My Coach with AI</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => setActiveTab('discovery')}
                className="px-6 py-4 rounded-xl bg-brand-card border border-brand-border text-white font-semibold text-sm hover:bg-white/10 hover:border-zinc-600 transition flex items-center justify-center space-x-2"
              >
                <span>Browse All Coaches</span>
              </button>
            </motion.div>

            {/* Quick Metrics Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-brand-border/40 grid grid-cols-3 gap-4"
            >
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">98.4%</div>
                <div className="text-[11px] text-brand-muted uppercase font-medium">Match Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">1,200+</div>
                <div className="text-[11px] text-brand-muted uppercase font-medium">Verified Coaches</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-brand-accent font-mono">4.9/5.0</div>
                <div className="text-[11px] text-brand-muted uppercase font-medium">Average Rating</div>
              </div>
            </motion.div>

          </div>

          {/* Right Column - Interactive AI Visualizer Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="glass-panel-elevated p-6 rounded-3xl border border-brand-border shadow-2xl relative overflow-hidden">
              
              {/* Card top banner */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-accent/50 p-0.5">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
                      alt="Coach Marcus"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white text-sm">Marcus Vance</span>
                      <ShieldCheck className="w-4 h-4 text-brand-accent fill-brand-accent/20" />
                    </div>
                    <span className="text-[11px] text-brand-muted">Track & Speed Specialist</span>
                  </div>
                </div>
                
                {/* AI Score Badge */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/40 text-brand-accent font-mono font-bold text-xs">
                    <Sparkles className="w-3 h-3 animate-spin-slow" />
                    <span>98% MATCH</span>
                  </div>
                  <span className="text-[9px] text-brand-muted mt-0.5">AI Vector Score</span>
                </div>
              </div>

              {/* Match vector radar preview */}
              <div className="py-5 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-brand-muted flex justify-between">
                  <span>Match Criteria Matrix</span>
                  <span className="text-white">Analysis Complete</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">Biomechanical Alignment</span>
                      <span className="text-brand-accent font-mono font-bold">99%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-accent rounded-full w-[99%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">Coaching Philosophy</span>
                      <span className="text-brand-accent font-mono font-bold">96%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-accent rounded-full w-[96%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-300">Schedule & Location Fit</span>
                      <span className="text-brand-accent font-mono font-bold">95%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[95%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card CTA */}
              <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-brand-muted">Starting from</span>
                  <div className="text-lg font-bold text-white font-mono">$95 <span className="text-xs text-brand-muted font-normal">/ session</span></div>
                </div>
                <button
                  onClick={() => setActiveTab('matchmaking')}
                  className="px-4 py-2 rounded-lg bg-brand-accent text-black font-extrabold text-xs hover:bg-brand-accentHover transition flex items-center space-x-1.5"
                >
                  <span>Connect Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
