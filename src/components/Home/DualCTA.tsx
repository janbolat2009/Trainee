import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Trophy, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';

export const DualCTA: React.FC = () => {
  const { setActiveTab, setIsOnboardingOpen, setUserRole } = useApp();

  return (
    <section className="py-20 bg-brand-black border-b border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1 - Athlete Path */}
          <div className="glass-panel p-8 rounded-3xl border border-brand-border flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-accent/10 transition" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-brand-accent" />
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-brand-accent mb-2">FOR ATHLETES</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                Unlock Your Next Athletic Breakthrough
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed mb-6">
                Stop guessing your training protocols. Get matched with top-tier coaches who specialize in your exact sport, biomechanics, and performance goals.
              </p>
            </div>

            <div className="pt-6 border-t border-brand-border/40 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setActiveTab('matchmaking')}
                className="px-6 py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Start AI Matchmaker</span>
              </button>
              
              <button
                onClick={() => {
                  setUserRole('athlete');
                  setIsOnboardingOpen(true);
                }}
                className="px-5 py-3.5 rounded-xl bg-brand-card border border-brand-border text-white font-semibold text-xs hover:bg-white/10 transition flex items-center justify-center space-x-2"
              >
                <span>Create Athlete Profile</span>
              </button>
            </div>
          </div>

          {/* Card 2 - Coach Path */}
          <div className="glass-panel p-8 rounded-3xl border border-brand-border flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-white mb-2">FOR COACHES & CLUBS</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                Monetize Your Expertise & Reach Elite Talent
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed mb-6">
                Get verified on TRAINEE™, display your credential badges, set your custom pricing tiers, and receive pre-qualified athlete matches automatically.
              </p>
            </div>

            <div className="pt-6 border-t border-brand-border/40 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setUserRole('coach');
                  setIsOnboardingOpen(true);
                }}
                className="px-6 py-3.5 rounded-xl bg-brand-card border border-zinc-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-brand-accent" />
                <span>Apply as Verified Coach</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
