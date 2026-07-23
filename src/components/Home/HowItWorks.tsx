import React, { useState } from 'react';
import { Sparkles, Target, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Build Your Athletic Profile',
      subtitle: 'Specify your current sport level, mechanical bottlenecks, performance goals, and budget preference.',
      icon: <Target className="w-6 h-6 text-brand-accent" />,
      detail: 'Our intelligent questionnaire maps your athletic archetype, communication style preference, and training schedule constraints in less than 2 minutes.'
    },
    {
      num: '02',
      title: 'AI Multi-Vector Matching',
      subtitle: 'Our neural algorithm computes compatibility against hundreds of verified coaches.',
      icon: <Sparkles className="w-6 h-6 text-brand-accent" />,
      detail: 'We evaluate coaching certifications, proven track records, biomechanical specialization, and tactical philosophy to generate your top 3 personalized coach recommendations with confidence scores.'
    },
    {
      num: '03',
      title: 'Connect & Unlock Breakthroughs',
      subtitle: 'Directly schedule 1-on-1 sessions, access tailored drills, and track measurable growth.',
      icon: <Zap className="w-6 h-6 text-brand-accent" />,
      detail: 'Message coaches directly, book field/court or remote video audits, and receive ongoing guidance with progress tracking backed by TRAINEE™ guarantee.'
    }
  ];

  return (
    <section className="py-20 bg-brand-black border-b border-brand-border/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span>THE TRAINEE ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            How AI Matchmaking Elevates Your Game
          </h2>
          <p className="text-brand-muted text-sm sm:text-base">
            No more trial-and-error searching. Connect with verified coaches backed by algorithmic compatibility.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative border ${
                  isSelected 
                    ? 'bg-brand-card border-brand-accent/50 shadow-glow-accent' 
                    : 'bg-brand-dark/50 border-brand-border/60 hover:bg-brand-card hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-2xl font-black font-mono text-brand-muted">
                    {step.num}
                  </div>
                  <div className="p-3 rounded-xl bg-brand-black border border-brand-border">
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed mb-4">
                  {step.subtitle}
                </p>

                <div className="pt-3 border-t border-brand-border/40 text-[11px] text-zinc-300 font-medium">
                  {step.detail}
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
