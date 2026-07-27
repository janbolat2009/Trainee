import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { Sparkles, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Role-based initial messages ───────────────────────────────────────────────

const ATHLETE_INITIAL_MESSAGE: ChatMessage = {
  id: 'init-athlete',
  sender: 'assistant',
  text: "Hi! I'm your TRAINEE Copilot. I'll help you find the perfect coach, build your athletic profile, and reach your goals. What are you working towards?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedPrompts: ['Help me find a coach', 'How does AI Match work?', 'Optimize my profile', 'What are typical coaching prices?'],
};

const COACH_INITIAL_MESSAGE: ChatMessage = {
  id: 'init-coach',
  sender: 'assistant',
  text: "Hi Coach! I'm your TRAINEE Copilot. I can help you design training programs, analyze student progress, price your services, and grow your client base. What do you need help with?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedPrompts: [
    'Help me write a training plan',
    'How should I price my sessions?',
    'Tips to retain athletes long-term',
    'How to handle a struggling student',
  ],
};

// ── Response synthesizer ──────────────────────────────────────────────────────

const getAthleteResponse = (
  query: string,
  setActiveTab: (t: any) => void,
): { text: string; actionLink?: ChatMessage['actionLink']; suggested: string[] } => {
  const lower = query.toLowerCase();

  if (lower.includes('coach') || lower.includes('find') || lower.includes('search')) {
    return {
      text: "We have verified specialists in Track & Field, Tennis, Football, and more. Run the AI Matchmaker to get a compatibility score with every verified coach.",
      actionLink: { label: 'Launch AI Matchmaker', tab: 'matchmaking' },
      suggested: ['Find Tennis Coaches', 'How does pricing work?'],
    };
  }
  if (lower.includes('match') || lower.includes('ai')) {
    return {
      text: "TRAINEE AI Matchmaking uses 20+ vectors — including biomechanics, style, location, and budget — to compute a compatibility score for every verified coach.",
      actionLink: { label: 'Take Match Quiz', tab: 'matchmaking' },
      suggested: ['View all coaches', 'Tell me about pricing'],
    };
  }
  if (lower.includes('profile') || lower.includes('optimize')) {
    return {
      text: "Fill in your primary goals and self-rated skill metrics to boost AI match accuracy by up to 40%. A complete profile also builds trust with coaches.",
      actionLink: { label: 'Go to Athlete Hub', tab: 'athlete-profile' },
      suggested: ['What goals should I add?', 'Find me a coach'],
    };
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('$')) {
    return {
      text: "Coaches set transparent pricing: Starter Sessions average $85–$110, Monthly Prep $300–$450, Full Retainers for elite athletes. No hidden commissions.",
      actionLink: { label: 'Explore Coaches', tab: 'discovery' },
      suggested: ['Find a coach in my budget', 'Start AI Match'],
    };
  }
  if (lower.includes('motivat') || lower.includes('stuck')) {
    return {
      text: "Consistency beats intensity. Break big goals into weekly checkpoints, track small wins, and schedule rest days intentionally. Would you like a sample weekly structure?",
      suggested: ['Create a weekly plan', 'Find a motivating coach'],
    };
  }

  return {
    text: "I can help with finding coaches, understanding AI matching, pricing, or setting up your athlete profile. What would you like to know?",
    suggested: ['Find a coach', 'How does matching work?', 'Help with my profile'],
  };
};

const getCoachResponse = (
  query: string,
): { text: string; actionLink?: ChatMessage['actionLink']; suggested: string[] } => {
  const lower = query.toLowerCase();

  if (lower.includes('training plan') || lower.includes('program') || lower.includes('periodiz')) {
    return {
      text: "A solid periodization model for most athletes: 3–4 weeks of progressive overload → 1 deload week. Start with a base phase (volume), then build intensity, and peak before competition. Want a template for a specific sport?",
      suggested: ['Sprint periodization', 'Strength block template', 'Recovery week structure'],
    };
  }
  if (lower.includes('price') || lower.includes('rate') || lower.includes('charge') || lower.includes('cost')) {
    return {
      text: "Benchmark rates: Online coaching $50–$150/session, offline $80–$200+. Monthly retainers ($400–$1200) improve athlete retention and give you predictable income. Consider a starter package at a lower rate to build trust with new athletes.",
      suggested: ['How to package services', 'Tips to justify premium rates', 'Create my first listing'],
    };
  }
  if (lower.includes('retain') || lower.includes('keep') || lower.includes('client') || lower.includes('churn')) {
    return {
      text: "Key retention tactics: monthly progress reviews, milestone celebrations, transparent communication about plateaus, and offering flexible package upgrades. Athletes stay when they see clear progress.",
      suggested: ['How to run a progress review', 'What metrics to track', 'Help me write a check-in message'],
    };
  }
  if (lower.includes('student') || lower.includes('athlete') || lower.includes('progress') || lower.includes('struggling')) {
    return {
      text: "When a student plateaus or struggles: first check recovery markers (sleep, fatigue, pain). Deload if needed. Then review technique via video. Open a 1:1 check-in conversation — often the issue is psychological or schedule-related.",
      suggested: ['What are good recovery metrics?', 'How to give constructive feedback', 'Fatigue monitoring tips'],
    };
  }
  if (lower.includes('parent') || lower.includes('communicat') || lower.includes('feedback')) {
    return {
      text: "For youth athletes, keep parents updated weekly with short written summaries — what was worked on, what improved, what the next focus is. Avoid jargon. Positive framing builds trust and reduces anxiety.",
      suggested: ['Draft a weekly update', 'How to handle parent concerns', 'Setting expectations'],
    };
  }
  if (lower.includes('listing') || lower.includes('announc') || lower.includes('attract')) {
    return {
      text: "A strong listing includes: specific athlete level you work with, your coaching philosophy in 2–3 sentences, 2–3 measurable achievements, and a clear price. Active listings in My Listings get shown to athletes in Discovery.",
      actionLink: { label: 'My Listings', tab: 'coach-listings' },
      suggested: ['What should I write in description?', 'How to price my listing', 'Tips for getting first clients'],
    };
  }

  return {
    text: "I can help with training programs, student progress analysis, pricing your services, communication with parents, and growing your coaching business. What's on your mind?",
    suggested: ['Help me write a training plan', 'Pricing advice', 'Retain my athletes longer'],
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AICopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, setActiveTab, userRole } = useApp();
  const isCoach = userRole === 'coach';

  const initialMessage = isCoach ? COACH_INITIAL_MESSAGE : ATHLETE_INITIAL_MESSAGE;
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset messages when role changes
  useEffect(() => {
    setMessages([isCoach ? COACH_INITIAL_MESSAGE : ATHLETE_INITIAL_MESSAGE]);
  }, [isCoach]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  if (!isCopilotOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const { text, actionLink, suggested } = isCoach
        ? getCoachResponse(query)
        : getAthleteResponse(query, setActiveTab);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: suggested,
        actionLink,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  const subtitle = isCoach ? 'COACH MODE • TRAINING & BUSINESS AI' : 'ATHLETE MODE • POWERED BY AI MATRIX';

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel-elevated rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col h-[520px]"
      >
        {/* Header */}
        <div className="p-4 bg-brand-dark/90 border-b border-brand-border/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border text-brand-accent ${isCoach ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' : 'bg-brand-accent/20 border-brand-accent/40'}`}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>TRAINEE™ Copilot</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-brand-muted font-mono">{subtitle}</span>
            </div>
          </div>
          <button
            onClick={() => setIsCopilotOpen(false)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  isUser
                    ? 'bg-white text-black font-medium rounded-br-none shadow-sm'
                    : 'bg-brand-card border border-brand-border text-zinc-200 rounded-bl-none'
                }`}>
                  {msg.text}

                  {msg.actionLink && (
                    <div className="mt-2.5 pt-2 border-t border-brand-border/50">
                      <button
                        onClick={() => {
                          setActiveTab(msg.actionLink!.tab as Parameters<typeof setActiveTab>[0]);
                          setIsCopilotOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-accent text-black font-extrabold text-[10px] uppercase hover:bg-brand-accentHover transition flex items-center space-x-1"
                      >
                        <span>{msg.actionLink.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-mono text-zinc-500 mt-1 px-1">{msg.timestamp}</span>

                {!isUser && msg.suggestedPrompts && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 rounded-full bg-brand-elevated border border-brand-border text-[10px] text-brand-muted hover:text-white hover:border-zinc-500 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-1.5 p-3 rounded-2xl bg-brand-card border border-brand-border w-fit text-brand-muted text-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-spin-slow" />
              <span className="font-mono">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-brand-dark/90 border-t border-brand-border/60">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isCoach ? 'Ask about training, pricing, students...' : 'Ask Copilot anything...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-accent"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
