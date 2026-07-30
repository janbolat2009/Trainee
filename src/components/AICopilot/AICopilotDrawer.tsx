import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChatMessage, CopilotConversationMessage } from '../../types';
import { Sparkles, X, Send, Bot, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendCopilotMessage, getAIErrorMessage, AIError } from '../../services/aiService';

// ── Fallback (offline) responses — used when AI is unavailable ────────────────

const getFallbackResponse = (
  query: string,
  isCoach: boolean,
  setActiveTab: (t: Parameters<ReturnType<typeof useApp>['setActiveTab']>[0]) => void,
): { text: string; actionLink?: ChatMessage['actionLink']; suggested: string[] } => {
  const lower = query.toLowerCase();

  if (!isCoach) {
    if (lower.includes('coach') || lower.includes('find')) {
      return {
        text: "We have verified specialists in Track & Field, Tennis, Football, and more. Run the AI Matchmaker to get a compatibility score with every verified coach.",
        actionLink: { label: 'Launch AI Matchmaker', tab: 'matchmaking' },
        suggested: ['Find Tennis Coaches', 'How does pricing work?'],
      };
    }
    if (lower.includes('match') || lower.includes('ai')) {
      return {
        text: "TRAINEE AI Matchmaking uses 10+ dimensions — including coaching style, budget, schedule, and goals — to compute a compatibility score for every verified coach.",
        actionLink: { label: 'Take Match Quiz', tab: 'matchmaking' },
        suggested: ['View all coaches', 'Tell me about pricing'],
      };
    }
    if (lower.includes('profile') || lower.includes('optimize')) {
      return {
        text: "Fill in your primary goals and self-rated skill metrics to boost AI match accuracy. A complete profile also builds trust with coaches.",
        actionLink: { label: 'Go to Athlete Hub', tab: 'athlete-profile' },
        suggested: ['What goals should I add?', 'Find me a coach'],
      };
    }
    return {
      text: "I can help with finding coaches, AI matching, pricing, or setting up your athlete profile. What would you like to know?",
      suggested: ['Find a coach', 'How does matching work?', 'Help with my profile'],
    };
  }

  if (lower.includes('price') || lower.includes('rate')) {
    return {
      text: "Benchmark rates: Online coaching $50–$150/session. Monthly retainers ($400–$1200) improve retention and give predictable income.",
      suggested: ['How to package services', 'Tips to justify premium rates'],
    };
  }
  return {
    text: "I can help with training programs, student progress, pricing, and growing your coaching business. What's on your mind?",
    suggested: ['Help me write a training plan', 'Pricing advice', 'Retain my athletes longer'],
  };
};

// ── Role-based initial messages ────────────────────────────────────────────────

const makeInitialMessage = (name: string | undefined, isCoach: boolean): ChatMessage => ({
  id: `init-${Date.now()}`,
  sender: 'assistant',
  text: isCoach
    ? `Hi Coach${name ? ` ${name}` : ''}! I'm your TRAINEE™ Copilot. I can help you design training programs, manage athletes, price your services, and grow your coaching business. What do you need?`
    : `Hi${name ? ` ${name}` : ''}! I'm your TRAINEE™ Copilot. I'll help you find the perfect coach, improve your profile, and reach your goals. What are you working towards?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedPrompts: isCoach
    ? ['Help me write a training plan', 'How should I price my sessions?', 'Tips to retain athletes', 'How to attract more clients']
    : ['Help me find a coach', 'How does AI Match work?', 'Optimize my profile', 'What are typical coaching prices?'],
});

// ── Component ─────────────────────────────────────────────────────────────────

export const AICopilotDrawer: React.FC = () => {
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    setActiveTab,
    activeTab,
    userRole,
    currentProfile,
    coachesList,
    filters,
    isAuthenticated,
    setIsLoginOpen,
  } = useApp();

  const isCoach = userRole === 'coach';
  const profileData = currentProfile?.profile;
  const userName = profileData?.name?.split(' ')[0];

  const [messages, setMessages] = useState<ChatMessage[]>([makeInitialMessage(userName, isCoach)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAIOnline, setIsAIOnline] = useState(true); // optimistic

  // Conversation history for OpenAI context (parallel to messages state, in OpenAI format)
  const conversationHistoryRef = useRef<CopilotConversationMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset when role or auth changes
  useEffect(() => {
    setMessages([makeInitialMessage(userName, isCoach)]);
    conversationHistoryRef.current = [];
    setAiError(null);
  }, [isCoach, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isCopilotOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    if (!isAuthenticated) {
      const authMsg: ChatMessage = {
        id: `auth-${Date.now()}`,
        sender: 'assistant',
        text: 'Please sign in to use AI Copilot. Log in to continue with personalized AI assistance.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: ['Sign in'],
      };
      setMessages((prev) => [...prev, authMsg]);
      setIsTyping(false);
      setIsLoginOpen(true);
      return;
    }

    // Append user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);
    setAiError(null);

    // Track in OpenAI-format history
    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: 'user' as const, content: query },
    ].slice(-10); // keep last 10

    // ── Try real AI ──────────────────────────────────────────────────────────
    if (isAuthenticated && profileData) {
      try {
        const aiResponse = await sendCopilotMessage(
          query,
          conversationHistoryRef.current.slice(0, -1), // exclude the current message we just added
          profileData as Parameters<typeof sendCopilotMessage>[2],
          userRole,
          {
            currentPage: activeTab,
            searchQuery: filters.searchQuery,
            activeFilters: {
              sport: filters.sport,
              maxPrice: filters.maxPrice,
              minRating: filters.minRating,
              skillLevel: filters.skillLevel,
              coachingStyle: filters.coachingStyle,
              availability: filters.availability,
              verifiedOnly: filters.verifiedOnly,
            },
          },
          coachesList,
        );

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: aiResponse.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedPrompts: aiResponse.suggestedPrompts,
          actionLink: aiResponse.actionLink,
        };

        setMessages((prev) => [...prev, botMsg]);
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: 'assistant' as const, content: aiResponse.message },
        ].slice(-10);

        setIsTyping(false);
        setIsAIOnline(true);
        return;
      } catch (err) {
        const isRateLimit = err instanceof AIError && err.type === 'rate_limit';
        const isAuth = err instanceof AIError && err.type === 'auth';

        if (isAuth) {
          // Session expired — show login prompt
          const authMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: 'Your session has expired. Please log in again to continue using AI Copilot.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedPrompts: ['Sign in'],
          };
          setMessages((prev) => [...prev, authMsg]);
          setIsTyping(false);
          return;
        }

        if (isRateLimit) {
          setAiError(getAIErrorMessage(err));
          setIsAIOnline(false);
        } else {
          console.warn('[AICopilotDrawer] AI call failed, using fallback:', err);
          setIsAIOnline(false);
        }

        // Fall through to offline fallback below
      }
    }

    // ── Offline / unauthenticated fallback ─────────────────────────────────
    setTimeout(() => {
      const { text, actionLink, suggested } = getFallbackResponse(query, isCoach, setActiveTab);

      const prefix = !isAuthenticated
        ? 'Sign in for personalized AI responses. '
        : (!isAIOnline ? 'AI is temporarily unavailable. ' : '');

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: prefix + text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: !isAuthenticated ? [...suggested, 'Sign in for AI responses'] : suggested,
        actionLink,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const subtitle = isCoach ? 'COACH MODE • TRAINING & BUSINESS AI' : 'ATHLETE MODE • POWERED BY GPT-4o-mini';

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[26rem]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel-elevated rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col h-[540px]"
      >
        {/* Header */}
        <div className="p-4 bg-brand-dark/90 border-b border-brand-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${isCoach ? 'bg-amber-400/20 border-amber-400/40 text-amber-400' : 'bg-brand-accent/20 border-brand-accent/40 text-brand-accent'}`}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>TRAINEE™ Copilot</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isAIOnline && isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
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

        {/* Sign-in prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between shrink-0">
            <p className="text-[11px] text-brand-muted leading-snug">
              Sign in for personalized AI responses using your profile.
            </p>
            <button
              onClick={() => { setIsLoginOpen(true); setIsCopilotOpen(false); }}
              className="ml-2 px-2.5 py-1.5 rounded-lg bg-white text-black font-bold text-[10px] uppercase shrink-0 hover:bg-zinc-200 transition"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Rate limit / AI error banner */}
        {aiError && (
          <div className="mx-3 mt-2 p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start space-x-2 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-300 leading-snug">{aiError}</p>
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                  isUser
                    ? 'bg-white text-black font-medium rounded-br-none shadow-sm'
                    : 'bg-brand-card border border-brand-border text-zinc-200 rounded-bl-none'
                }`}>
                  {msg.text}

                  {msg.actionLink && (
                    <div className="mt-2.5 pt-2 border-t border-brand-border/50">
                      <button
                        onClick={() => {
                          if (msg.actionLink!.tab === 'matchmaking' || msg.actionLink!.tab === 'discovery' || msg.actionLink!.tab === 'athlete-profile') {
                            setActiveTab(msg.actionLink!.tab as Parameters<typeof setActiveTab>[0]);
                          }
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
                        onClick={() => {
                          if (prompt === 'Sign in') {
                            setIsLoginOpen(true);
                            setIsCopilotOpen(false);
                            return;
                          }
                          handleSendMessage(prompt);
                        }}
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
        <div className="p-3 bg-brand-dark/90 border-t border-brand-border/60 shrink-0">
          {/* AI model badge */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono text-brand-muted/60 uppercase">
              {isAuthenticated ? (isAIOnline ? '✦ GPT-4o-mini · Live' : '✦ Offline mode') : '✦ Sign in for AI responses'}
            </span>
            {!isAIOnline && isAuthenticated && (
              <button
                onClick={() => { setIsAIOnline(true); setAiError(null); }}
                className="text-[9px] font-mono text-brand-accent flex items-center space-x-1 hover:text-white transition"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isCoach ? 'Ask about training, pricing, athletes...' : 'Ask Copilot anything...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-brand-card border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
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
