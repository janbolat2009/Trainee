import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Athlete, Coach } from '../../types';
import { VerificationBadgeModal } from './VerificationBadgeModal';
import { MOCK_COACH_QA, MOCK_REVIEWS } from '../../data/mockData';
import { QASection } from './QASection';
import { BookingModal } from './BookingModal';
import { EditProfileModal } from './EditProfileModal';
import { AvailabilityManagerModal } from './AvailabilityManagerModal';
import {
  ShieldCheck, Star, MapPin, Award, CheckCircle2, ArrowLeft, Bookmark, Calendar,
  Phone, Mail, MessageSquare, Edit3, Globe, Briefcase, GraduationCap, Users, Twitter, Instagram, Linkedin, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CoachProfileView: React.FC = () => {
  const {
    selectedCoach, setActiveTab, savedCoachIds, toggleSaveCoach,
    isAuthenticated, currentProfile, setIsLoginOpen, activeTab,
  } = useApp();

  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAvailabilityManagerOpen, setIsAvailabilityManagerOpen] = useState(false);

  // Use the authenticated coach's profile if a coach is viewing their own profile, else selectedCoach
  const isCoachRole = currentProfile?.role === 'coach';
  const isOwnProfile = isCoachRole && (currentProfile.profile.id === selectedCoach.id || activeTab === 'coach-profile');
  const coach: Coach = (isCoachRole && isOwnProfile) ? (currentProfile.profile as Coach) : selectedCoach;

  const isSaved = savedCoachIds.includes(coach.id);
  const athleteProfile = currentProfile?.role === 'athlete' ? (currentProfile.profile as Athlete) : null;

  const handleBooking = async () => {
    if (!isAuthenticated || !currentProfile || !athleteProfile) {
      setIsLoginOpen(true);
      return;
    }
    setIsBookingModalOpen(true);
  };

  const displayLocation = [coach.city, coach.country].filter(Boolean).join(', ') || coach.location || 'Not specified';
  const languagesList = coach.languagesSpoken && coach.languagesSpoken.length > 0 ? coach.languagesSpoken : coach.languages ?? [];

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

      {/* Cover Banner */}
      <div className="relative mt-3 h-48 w-full overflow-hidden border-y border-white/[0.08] bg-brand-dark sm:h-64 md:h-72">
        {coach.coverImage ? (
          <img
            src={coach.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full grid-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-[#0b0d10]/40 to-transparent" />
      </div>

      {/* Header Profile Section */}
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
                src={coach.avatar}
                alt={coach.name}
                className="h-28 w-28 rounded-3xl object-cover ring-4 ring-[#0b0d10] shadow-2xl sm:h-36 sm:w-36"
              />
              {coach.isVerified && (
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-accent text-black shadow-glow-accent">
                  <ShieldCheck className="w-5 h-5 fill-black" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                  {coach.name}
                </h1>
                <button
                  onClick={() => setIsVerificationOpen(true)}
                  className="px-2.5 py-1 rounded bg-brand-accent/15 border border-brand-accent/40 text-brand-accent font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-brand-accent/30 transition flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{coach.verificationBadge || 'Verified Coach'}</span>
                </button>
                {coach.trainingFormat && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-zinc-300 capitalize">
                    {coach.trainingFormat} Format
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-brand-muted max-w-xl">
                {coach.specialization ? `${coach.specialization} • ` : ''}{coach.title}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brand-muted">
                <div className="flex items-center space-x-1 text-white font-bold">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{coach.rating || 5.0}</span>
                  <span className="text-brand-muted font-normal">({coach.reviewCount || 0} reviews)</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                  <span>{displayLocation}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isCoachRole && (
              <>
                <button
                  onClick={() => setIsAvailabilityManagerOpen(true)}
                  className="flex items-center space-x-2 rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-5 py-3 text-xs font-bold text-brand-accent transition hover:bg-brand-accent/30 shadow-glow-accent min-h-[44px]"
                >
                  <Clock className="w-4 h-4 text-brand-accent" />
                  <span>Manage Availability</span>
                </button>

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex items-center space-x-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/20 min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </>
            )}

            <button
              onClick={() => toggleSaveCoach(coach.id)}
              className={`p-3 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isSaved
                  ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                  : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-brand-accent' : ''}`} />
            </button>

            <button
              onClick={() => void handleBooking()}
              className="flex items-center space-x-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-glow-white min-h-[44px]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Consultation</span>
            </button>
          </div>
        </motion.div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{coach.yearsExperience || 0} YRS</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Coaching Experience</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{coach.athletesTrained || 0}+</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Athletes Trained</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-brand-accent font-mono">{coach.coachingStyle || 'Data-Driven'}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Primary Style</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-panel p-4 rounded-2xl border border-brand-border text-center"
          >
            <div className="text-2xl font-black text-white font-mono">{coach.availability || 'Immediate'}</div>
            <div className="text-[11px] text-brand-muted uppercase font-medium">Current Status</div>
          </motion.div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0 max-w-full">
          <div className="lg:col-span-7 space-y-8 min-w-0 max-w-full">
            {/* Biography & Philosophy */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4 min-w-0 max-w-full overflow-hidden"
            >
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight break-words">
                Coaching Philosophy & Background
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed break-words whitespace-pre-wrap min-w-0 max-w-full">
                {coach.bio || 'No biography provided yet.'}
              </p>

              <div className="pt-4 border-t border-brand-border/60 space-y-3">
                <div className="text-xs font-mono uppercase text-brand-muted">Specialized Sports</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-bold font-mono">
                    {coach.sport}
                  </span>
                  {(coach.secondarySports ?? []).map((sec, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-brand-elevated border border-brand-border text-zinc-300 text-xs font-mono">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {languagesList.length > 0 && (
                <div className="pt-3 border-t border-brand-border/60">
                  <div className="text-xs font-mono uppercase text-brand-muted mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Languages Spoken</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map((lang, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-zinc-300">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Achievements */}
            {coach.achievements && coach.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4"
              >
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                  <Award className="w-5 h-5 text-brand-accent" />
                  <span>Track Record & Achievements</span>
                </h2>
                <div className="space-y-3">
                  {coach.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-brand-dark/50 border border-brand-border/60">
                      <CheckCircle2 className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-zinc-200 leading-relaxed">{ach}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Additional Information (Previous Teams, Education, Areas of Expertise) */}
            {((coach.previousTeams && coach.previousTeams.length > 0) || coach.education || (coach.areasOfExpertise && coach.areasOfExpertise.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-5"
              >
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight">
                  Professional Experience & Credentials
                </h2>

                {coach.previousTeams && coach.previousTeams.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-brand-muted flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Previous Teams & Clubs</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {coach.previousTeams.map((team, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-brand-dark border border-brand-border text-xs text-zinc-200">
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {coach.education && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <div className="text-xs font-mono uppercase text-brand-muted flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Education</span>
                    </div>
                    <p className="text-xs text-zinc-300">{coach.education}</p>
                  </div>
                )}

                {coach.areasOfExpertise && coach.areasOfExpertise.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-brand-border/60">
                    <div className="text-xs font-mono uppercase text-brand-muted flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Areas of Expertise</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {coach.areasOfExpertise.map((exp, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-brand-accent/10 border border-brand-accent/30 text-xs text-brand-accent font-medium">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Certifications Verification */}
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
                  <div className="text-xs text-brand-muted">{(coach.certifications ?? []).length} Credentials Audited</div>
                </div>
              </div>
              <button
                onClick={() => setIsVerificationOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Inspect Credentials
              </button>
            </motion.div>

            {/* Verified Reviews */}
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
                  <span>{coach.rating || 5.0} / 5.0</span>
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

          {/* Pricing & Contact Sidebar */}
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

              {coach.pricingTiers && coach.pricingTiers.length > 0 ? (
                <div className="space-y-3">
                  {coach.pricingTiers.map((tier, idx) => {
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
              ) : (
                <div className="p-4 rounded-2xl bg-brand-dark border border-brand-border text-center space-y-2">
                  <div className="text-2xl font-black font-mono text-white">
                    ${coach.hourlyRate || 100} <span className="text-xs text-zinc-400 font-normal">/ hr</span>
                  </div>
                  <p className="text-xs text-zinc-400">Standard hourly coaching rate</p>
                </div>
              )}

              {currentProfile?.role === 'athlete' && (
                <button
                  onClick={() => void handleBooking()}
                  className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-glow-white flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-black" />
                  <span>Request Booking</span>
                </button>
              )}

              {isCoachRole && (
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/[0.1]"
                >
                  Edit Profile Information
                </button>
              )}

              <div className="pt-4 border-t border-brand-border/60 space-y-2.5 text-xs font-mono text-brand-muted">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{coach.contactNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{coach.email || 'Not provided'}</span>
                </div>
              </div>

              {coach.socialLinks && (coach.socialLinks.twitter || coach.socialLinks.instagram || coach.socialLinks.linkedin) && (
                <div className="pt-3 border-t border-brand-border/60 flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-500">Social:</span>
                  {coach.socialLinks.twitter && (
                    <a href={coach.socialLinks.twitter.startsWith('http') ? coach.socialLinks.twitter : `https://twitter.com/${coach.socialLinks.twitter}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-brand-accent transition">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {coach.socialLinks.instagram && (
                    <a href={coach.socialLinks.instagram.startsWith('http') ? coach.socialLinks.instagram : `https://instagram.com/${coach.socialLinks.instagram}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-brand-accent transition">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {coach.socialLinks.linkedin && (
                    <a href={coach.socialLinks.linkedin.startsWith('http') ? coach.socialLinks.linkedin : `https://linkedin.com/in/${coach.socialLinks.linkedin}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-brand-accent transition">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <VerificationBadgeModal
        coach={coach}
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coach={coach}
        athleteProfile={athleteProfile}
        onBookingCreated={() => setIsBookingModalOpen(false)}
      />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <AvailabilityManagerModal
        isOpen={isAvailabilityManagerOpen}
        onClose={() => setIsAvailabilityManagerOpen(false)}
        coach={coach}
      />
    </div>
  );
};
