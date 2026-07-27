import React, { useState } from 'react';
import { QAItem } from '../../types';
import { HelpCircle, ChevronDown, ThumbsUp, Plus, Send, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QASectionProps {
  initialItems: QAItem[];
  title?: string;
  subtitle?: string;
  roleName?: string;
}

export const QASection: React.FC<QASectionProps> = ({
  initialItems,
  title = "Frequently Asked Questions & Q&A",
  subtitle = "Direct answers regarding session logistics, equipment, and training methodology.",
  roleName = "Coach"
}) => {
  const [qaItems, setQaItems] = useState<QAItem[]>(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(initialItems[0]?.id || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAskModalOpen, setIsAskModalOpen] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('General');
  const [submittedNotice, setSubmittedNotice] = useState<boolean>(false);

  const categories = ['All', ...Array.from(newSet(qaItems.map(item => item.category)))];

  function newSet(arr: string[]): string[] {
    return Array.from(new Set(arr));
  }

  const filteredItems = selectedCategory === 'All'
    ? qaItems
    : qaItems.filter(item => item.category === selectedCategory);

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQaItems(prev => prev.map(item => item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item));
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newItem: QAItem = {
      id: `qa-user-${Date.now()}`,
      question: newQuestionText,
      answer: `Thank you for asking! ${roleName} has received your question and will post an answer shortly.`,
      category: newCategory,
      authorName: 'You',
      date: 'Just now',
      upvotes: 1
    };

    setQaItems(prev => [newItem, ...prev]);
    setExpandedId(newItem.id);
    setNewQuestionText('');
    setIsAskModalOpen(false);
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 4000);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border/60">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-brand-accent mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>COMMUNITY Q&A BAR</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            {subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsAskModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5 shadow-glow-white self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Question</span>
        </button>
      </div>

      <AnimatePresence>
        {submittedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-mono flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Question published to profile Q&A bar!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === cat
                ? 'bg-brand-accent text-black font-bold'
                : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <motion.div
              key={item.id}
              layout
              className="rounded-2xl bg-brand-dark border border-brand-border/60 overflow-hidden transition"
            >
              <button
                onClick={() => handleToggle(item.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-white/5 transition"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-brand-card border border-brand-border text-brand-accent mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">
                      {item.question}
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-brand-muted mt-1">
                      <span className="text-zinc-400">{item.category}</span>
                      {item.date && (
                        <>
                          <span>•</span>
                          <span>{item.date}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button
                    onClick={(e) => handleUpvote(item.id, e)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-card border border-brand-border text-[11px] font-mono text-zinc-300 hover:text-white hover:border-zinc-500 transition"
                  >
                    <ThumbsUp className="w-3 h-3 text-brand-accent" />
                    <span>{item.upvotes}</span>
                  </button>

                  <div className={`p-1 rounded-lg text-brand-muted transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-white' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-brand-border/40 text-xs text-zinc-300 leading-relaxed font-normal bg-brand-black/40">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsAskModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-brand-accent mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>NEW QUESTION</span>
              </div>

              <h3 className="text-xl font-extrabold text-white uppercase tracking-tight mb-1">
                Ask {roleName} a Question
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                Questions are answered publicly or sent directly to the profile owner.
              </p>

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-brand-muted block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-accent"
                  >
                    <option value="General">General</option>
                    <option value="Logistics">Logistics & Scheduling</option>
                    <option value="Equipment">Equipment & Tech</option>
                    <option value="Training Preference">Training Methodology</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-brand-muted block mb-1">Your Question</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. What is your turnaround time for video stroke analysis?"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAskModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-brand-dark border border-brand-border text-xs text-brand-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newQuestionText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Question</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
