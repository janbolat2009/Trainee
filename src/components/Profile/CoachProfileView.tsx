import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadgeModal } from './VerificationBadgeModal';
import { MOCK_REVIEWS } from '../../data/mockData';
import { ShieldCheck, Star, MapPin, Award, CheckCircle2, MessageSquare, ArrowLeft, Bookmark, Calendar, Sparkles, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export const CoachProfileView: React.FC = () => {
  const { selectedCoach, setActiveTab, savedCoachIds, toggleSaveCoach } = useApp();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [isBookingSent, setIsBookingSent] = useState(false);

  const isSaved = savedCoachIds.includes(selectedCoach.id);

  const handleBooking = () => {
    setIsBookingSent(true);
    setTimeout(() => {
      setIsBookingSent(false);
    }, 4000);
  };

  return (
    <div className="bg-brand-black min-h-screen pb-24">
      
      {/* Back Button Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => setActiveTab('discovery')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-muted hover:text-white transition py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Coach Directory</span>
        </button>
      </div>

      {/* Cover Header Image */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-brand-dark mt-2 border-y border-brand-border/60 overflow-hidden">
        {selectedCoach.coverImage ? (
          <img 
            src={selectedCoach.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full grid-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
      </div>

      {/* Profile Header Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-border/60">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <img 
                src={selectedCoach.avatar} 
                alt={selectedCoach.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-brand-black shadow-2xl" 
              />
              {selectedCoach.isVerified && (
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-accent text-black shadow-glow-accent">
                  <ShieldCheck className="w-5 h-5 fill-black" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
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

          {/* Action CTAs */}
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
              onClick={handleBooking}
              className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Consultation</span>
            </button>
          </div>

        </div>

        {/* Booking Notification Banner */}
        {isBookingSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Consultation request dispatched to {selectedCoach.name}! Coach will contact you within 2 hours.</span>
            </div>
          </motion.div>
        )}

        {/* Experience Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <div className="glass-panel p-4 rounded-2xl border border-brand-border text-center">
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.yearsExperience} YRS</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Coaching Experience</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-brand-border text-center">
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.athletesTrained}+</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Athletes Trained</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-brand-border text-center">
            <div className="text-2xl font-black text-brand-accent font-mono">{selectedCoach.coachingStyle}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Primary Style</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-brand-border text-center">
            <div className="text-2xl font-black text-white font-mono">{selectedCoach.availability}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Current Status</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Bio, Achievements, Certs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Bio Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4">
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
            </div>

            {/* Achievements List */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4">
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
            </div>

            {/* Verified Certifications Trigger Card */}
            <div className="glass-panel p-6 rounded-3xl border border-brand-border flex items-center justify-between">
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
            </div>

            {/* Reviews Section */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6">
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
            </div>

          </div>

          {/* Right Column - Pricing Tiers Card & Contact */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Pricing Tiers Card */}
            <div className="glass-panel-elevated p-6 rounded-3xl border border-brand-border space-y-6 sticky top-24">
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
                onClick={handleBooking}
                className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white"
              >
                Select Tier & Request Booking
              </button>

              {/* Direct Contact Info */}
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

            </div>

          </div>

        </div>

      </div>

      {/* Verification Modal */}
      <VerificationBadgeModal
        coach={selectedCoach}
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />
    </div>
  );
};
