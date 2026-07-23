import React, { useState } from 'react';
import { MATCHMAKING_QUIZ_QUESTIONS } from '../../data/mockData';
import { Sparkles, ArrowRight, ArrowLeft, Check, Activity, Trophy, Zap, Brain, Timer, Target, Flame, Waves, BarChart3, BrainCircuit, Compass, Coins, BadgeDollarSign, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizProps {
  onQuizComplete: (answers: Record<string, string>) => void;
}

export const ConversationalQuiz: React.FC<QuizProps> = ({ onQuizComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = MATCHMAKING_QUIZ_QUESTIONS[currentStep];

  const handleSelectOption = (field: string, value: string) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);

    if (currentStep < MATCHMAKING_QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onQuizComplete(updated);
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Activity': return <Activity className="w-5 h-5 text-brand-accent" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-brand-accent" />;
      case 'Brain': return <Brain className="w-5 h-5 text-zinc-300" />;
      case 'Timer': return <Timer className="w-5 h-5 text-brand-accent" />;
      case 'Target': return <Target className="w-5 h-5 text-white" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Waves': return <Waves className="w-5 h-5 text-cyan-400" />;
      case 'BarChart3': return <BarChart3 className="w-5 h-5 text-brand-accent" />;
      case 'BrainCircuit': return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'Coins': return <Coins className="w-5 h-5 text-zinc-300" />;
      case 'BadgeDollarSign': return <BadgeDollarSign className="w-5 h-5 text-brand-accent" />;
      case 'Crown': return <Crown className="w-5 h-5 text-amber-400" />;
      default: return <Sparkles className="w-5 h-5 text-brand-accent" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* Quiz Progress Indicator */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono uppercase text-brand-muted">
          <span>Question {currentStep + 1} of {MATCHMAKING_QUIZ_QUESTIONS.length}</span>
          <span className="text-brand-accent">{Math.round(((currentStep + 1) / MATCHMAKING_QUIZ_QUESTIONS.length) * 100)}% Completed</span>
        </div>
        <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-accent"
            animate={{ width: `${((currentStep + 1) / MATCHMAKING_QUIZ_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl border border-brand-border space-y-6"
        >
          {/* Question Title */}
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-accent mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI CONVERSATIONAL MATCHER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              {question.question}
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              {question.subtitle}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = answers[question.field] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectOption(question.field, opt.value)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-brand-elevated border-brand-accent shadow-glow-accent'
                      : 'bg-brand-dark/50 border-brand-border hover:bg-brand-card hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-brand-black border border-brand-border">
                      {renderIcon(opt.iconName)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm sm:text-base group-hover:text-brand-accent transition">
                        {opt.label}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-white group-hover:translate-x-1 transition" />
                </button>
              );
            })}
          </div>

          {/* Back Step Option */}
          {currentStep > 0 && (
            <div className="pt-4 border-t border-brand-border/60">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-brand-muted hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Question</span>
              </button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
