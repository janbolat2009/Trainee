import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_COPILOT_MESSAGES } from '../../data/mockData';
import { ChatMessage } from '../../types';
import { Sparkles, X, Send, Bot, User, ArrowRight, CornerDownLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AICopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, setActiveTab, viewCoachDetails, coachesList } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_COPILOT_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!isCopilotOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // AI Response Synthesizer
    setTimeout(() => {
      let botResponse = "I can assist you with finding coaches, understanding verified certifications, or setting up your athletic goals.";
      let actionLink: ChatMessage['actionLink'] = undefined;
      let suggested: string[] = ["Start AI Match Quiz", "View Verified Coaches", "Explain Pricing"];

      const lower = query.toLowerCase();

      if (lower.includes('coach') || lower.includes('find') || lower.includes('search') || lower.includes('tennis') || lower.includes('track')) {
        botResponse = "Based on our verified marketplace database, we have elite specialists available in Track & Field, Tennis, Football, and Combat Sports. Would you like to run the AI Matchmaker to calculate exact compatibility scores?";
        actionLink = { label: 'Launch AI Matchmaker', tab: 'matchmaking' };
        suggested = ["Find Tennis Coaches", "How does pricing work?"];
      } else if (lower.includes('match') || lower.includes('how') || lower.includes('ai')) {
        botResponse = "TRAINEE™ AI Matchmaking uses 20+ multi-dimensional vectors—including biomechanical requirements, coaching style, location, and budget—to compute a percentage compatibility score for every verified coach.";
        actionLink = { label: 'Take Match Questionnaire', tab: 'matchmaking' };
      } else if (lower.includes('profile') || lower.includes('optimize') || lower.includes('athlete')) {
        botResponse = "To optimize your athlete profile, ensure your primary goals (e.g. 100m sprint acceleration) and self-rated skill metrics are filled out. This improves AI match accuracy by 40%.";
        actionLink = { label: 'Go to Athlete Hub', tab: 'athlete-profile' };
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('$')) {
        botResponse = "Coaches set transparent pricing tiers: Starter Sessions (averaging $85-$110), Monthly Tournament Prep ($300-$450), and Full Pro Retainers. No hidden commission fees.";
        actionLink = { label: 'Explore Directory', tab: 'discovery' };
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: suggested,
        actionLink
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel-elevated rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col h-[520px]"
      >
        
        {/* Drawer Header */}
        <div className="p-4 bg-brand-dark/90 border-b border-brand-border/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                <span>TRAINEE™ Copilot</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-brand-muted font-mono">ONLINE • POWERED BY AI MATRIX</span>
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

                  {/* Action Link inside message */}
                  {msg.actionLink && (
                    <div className="mt-2.5 pt-2 border-t border-brand-border/50">
                      <button
                        onClick={() => {
                          setActiveTab(msg.actionLink!.tab as any);
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

                {/* Suggested Prompt Chips */}
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

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center space-x-1.5 p-3 rounded-2xl bg-brand-card border border-brand-border w-fit text-brand-muted text-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-spin-slow" />
              <span className="font-mono">Synthesizing AI response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-brand-dark/90 border-t border-brand-border/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot anything..."
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
