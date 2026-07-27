import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadgeModal } from './VerificationBadgeModal';
import { MOCK_COACH_QA, MOCK_REVIEWS } from '../../data/mockData';
import { QASection } from './QASection';
import { ShieldCheck, Star, MapPin, Award, CheckCircle2, ArrowLeft, Bookmark, Calendar, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOrCreateConversation, sendMessage } from '../../services/chatService';

export const CoachProfileView: React.FC = () => {
  const {
    selectedCoach, setActiveTab, savedCoachIds, toggleSaveCoach,
    isAuthenticated, currentProfile, setIsLoginOpen, setIsChatOpen, addNotification,
  } = useApp();

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [isBookingSending, setIsBookingSending] = useState(false);
  const [isBookingSent, setIsBookingSent] = useState(false);

  const isSaved = savedCoachIds.includes(selectedCoach.id);

  const handleBooking = async () => {
    // 1. If user is guest / not authenticated, prompt login
    if (!isAuthenticated || !currentProfile) {
      setIsLoginOpen(true);
      return;
    }

    setIsBookingSending(true);

    try {
      const athleteId = currentProfile.profile.id;
      const coachId = selectedCoach.id;

      // 2. Automatically create/get conversation in Supabase
      const conv = await getOrCreateConversation(athleteId, coachId);
      if (conv) {
        const tier = selectedCoach.pricingTiers[selectedTier];
        const tierName = tier?.name ?? 'Consultation';
        const tierPrice = tier?.price ?? selectedCoach.hourlyRate;

        // 3. Send initial booking message in Chat
        await sendMessage(
          conv.id,
          athleteId,
          `Hello Coach ${selectedCoach.name}! I would like to request booking for the "${tierName}" package ($${tierPrice}) in ${selectedCoach.sport}.`
        );

        setIsBookingSent(true);
        addNotification({
          type: 'success',
          title: 'Booking chat opened!',
          message: `Real-time chat conversation started with ${selectedCoach.name}.`,
        });

        // 4. Immediately open Realtime Chat Drawer
        setTimeout(() => {
          setIsChatOpen(true);
          setIsBookingSent(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error handling booking chat:', err);
    } finally {
      setIsBookingSending(false);
    }
  };

  return (
    <div className="liquid-shell min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => setActiveTab('discovery')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-muted hover:text-white transition py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Coach Directory</span>
        </button>
      </div>

      <div className="relative mt-3 h-48 w-full overflow-hidden border-y border-white/[0.08] bg-brand-dark sm:h-64 md:h-72">
        {selectedCoach.coverImage ? (
          <img
            src={selectedCoach.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full grid-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-[#0b0d10]/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-border/60"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <img
                src={selectedCoach.avatar}
                alt={selectedCoach.name}
                className="h-28 w-28 rounded-3xl object-cover ring-4 ring-[#0b0d10] shadow-2xl sm:h-36 sm:w-36"
              />
              {selectedCoach.isVerified && (
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-accent text-black shadow-glow-accent">
                  <ShieldCheck className="w-5 h-5 fill-black" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                  {selectedCoach.name}
                </h1>
                <button
                  onClick={() => setIsVerificationOpen(true)}
                  className="px-2.5 py-1 rounded bg-brand-accent/15 border border-brand-accent/40 text-brand-accent font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-brand-accent/30 transition flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{selectedCoach.verificationBadge}</span>
                </button>
              </div>

              <p className="text-sm font-medium text-brand-muted max-w-xl">
                {selectedCoach.title}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brand-muted">
                <div className="flex items-center space-x-1 text-white font-bold">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{selectedCoach.rating}</span>
                  <span className="text-brand-muted font-normal">({selectedCoach.reviewCount} reviews)</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                  <span>{selectedCoach.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleSaveCoach(selectedCoach.id)}
              className={`p-3 rounded-xl border transition ${
                isSaved
                  ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                  : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-brand-accent' : ''}`} />
            </button>

            <button
              onClick={() => void handleBooking()}
              disabled={isBookingSending}
              className="flex items-center space-x-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-glow-white disabled:opacity-60"
            >
              {isBookingSending ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span>{isBookingSending ? 'Creating Chat...' : 'Book Consultation'}</span>
            </button>
          </div>
        </motion.div>

        {isBookingSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Consultation request sent! Opening direct chat conversation with {selectedCoach.name}...</span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.yearsExperience} YRS</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Coaching Experience</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.athletesTrained}+</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Athletes Trained</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-brand-accent font-mono">{selectedCoach.coachingStyle}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Primary Style</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.availability}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Current Status</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4"
            >
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                Coaching Philosophy & Background
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedCoach.bio}
              </p>

              <div className="pt-4 border-t border-brand-border/60">
                <div className="text-xs font-mono uppercase text-brand-muted mb-2">Specialized Sports</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-bold font-mono">
                    {selectedCoach.sport}
                  </span>
                  {selectedCoach.secondarySports.map((sec, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-brand-elevated border border-brand-border text-zinc-300 text-xs font-mono">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4"
            >
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                <Award className="w-5 h-5 text-brand-accent" />
                <span>Track Record & Breakthroughs</span>
              </h2>
              <div className="space-y-3">
                {selectedCoach.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-brand-dark/50 border border-brand-border/60">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-zinc-200 leading-relaxed">{ach}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="glass-panel p-6 rounded-3xl border border-brand-border flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-8 h-8 text-brand-accent" />
                <div>
                  <div className="font-bold text-white text-sm">Official Credentials Verified</div>
                  <div className="text-xs text-brand-muted">{selectedCoach.certifications.length} Credentials Audited</div>
                </div>
              </div>
              <button
                onClick={() => setIsVerificationOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Inspect Credentials
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                  Verified Athlete Reviews
                </h2>
                <div className="flex items-center space-x-1 font-mono text-sm font-bold text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{selectedCoach.rating} / 5.0</span>
                </div>
              </div>

              <div className="space-y-4">
                {MOCK_REVIEWS.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-brand-dark border border-brand-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img src={rev.athleteAvatar} alt={rev.athleteName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-white text-xs">{rev.athleteName}</div>
                          <div className="text-[10px] text-brand-muted">{rev.sport}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-brand-muted">{rev.date}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
            >
              <QASection
                initialItems={MOCK_COACH_QA}
                title="Coach Q&A Bar"
                subtitle="Direct answers on scheduling, coaching style, and athlete support."
                roleName="Coach"
              />
            </motion.div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="glass-panel-elevated p-6 rounded-3xl border border-brand-border space-y-6 sticky top-24"
            >
              <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
                <h3 className="font-black text-white text-lg uppercase">Pricing Packages</h3>
                <span className="text-xs font-mono text-brand-accent">TRANSPARENT RATES</span>
              </div>

              <div className="space-y-3">
                {selectedCoach.pricingTiers.map((tier, idx) => {
                  const isSelected = selectedTier === idx;
                  return (
                    <div
                      key={tier.name}
                      onClick={() => setSelectedTier(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-brand-card border-brand-accent shadow-glow-accent'
                          : 'bg-brand-dark/50 border-brand-border hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{tier.name}</span>
                        <div className="font-mono text-base font-extrabold text-white">
                          ${tier.price} <span className="text-[10px] text-brand-muted font-normal">{tier.period}</span>
                        </div>
                      </div>
                      <p className="text-xs text-brand-muted mb-3">{tier.description}</p>

                      <div className="space-y-1.5 pt-2 border-t border-brand-border/40">
                        {tier.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center space-x-2 text-[11px] text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => void handleBooking()}
                disabled={isBookingSending}
                className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <MessageSquare className="w-4 h-4 text-black" />
                <span>{isBookingSending ? 'Starting Chat...' : 'Select Tier & Request Booking'}</span>
              </button>

              <div className="pt-4 border-t border-brand-border/60 space-y-2 text-xs font-mono text-brand-muted">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedCoach.contactNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{selectedCoach.email}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <VerificationBadgeModal
        coach={selectedCoach}
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />
    </div>
  );
};
