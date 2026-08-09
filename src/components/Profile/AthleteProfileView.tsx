import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QASection } from './QASection';
import { MOCK_ATHLETE_QA } from '../../data/mockData';
import { Trophy, Target, Activity, MapPin, Sparkles, Edit3, User, LogIn, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { WellbeingModal } from '../Support/WellbeingModal';
import { fetchAthleteBookings } from '../../services/bookingService';
import type { ConsultationBooking } from '../../types';
import { VideoMeetingModal } from '../Meetings/VideoMeetingModal';
import { EditProfileModal } from './EditProfileModal';

export const AthleteProfileView: React.FC = () => {
  const {
    selectedAthlete, setActiveTab, setIsOnboardingOpen, setIsLoginOpen,
    isAuthenticated, currentProfile, addNotification, activeMeetingBooking,
    setActiveMeetingBooking, subscription, openPricingModal,
  } = useApp();
  const [isWellbeingOpen, setIsWellbeingOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !currentProfile?.profile.id) return;
    void fetchAthleteBookings(currentProfile.profile.id).then(setBookings);
  }, [isAuthenticated, currentProfile?.profile.id]);

  // If user is guest (unauthenticated), show clear login/register CTA banner instead of dummy mock data
  if (!isAuthenticated) {
    return (
      <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel-elevated max-w-md w-full p-8 rounded-3xl border border-brand-border text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center mx-auto text-brand-accent">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Athlete Hub & Profile</h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              Sign in or create an account to manage your athletic profile, target PRs, track biomechanical metrics, and communicate directly with coaches.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-full sm:flex-1 py-3 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4 text-brand-accent" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full sm:flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition shadow-glow-white flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="pt-4 border-t border-brand-border/60 flex items-center justify-center space-x-2 text-[10px] font-mono text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
            <span>Verified Athlete Accounts & Real-Time Sync</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authenticated Profile View
  const athlete = currentProfile?.role === 'athlete' ? currentProfile.profile : selectedAthlete;

  return (
    <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14">
      <div className="max-w-7xl mx-auto space-y-7 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel-elevated relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl p-6 md:flex-row md:items-center sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/30 sm:h-28 sm:w-28"
            />
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                  {athlete.name}
                </h1>
                <span className="rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-brand-accent">
                  {athlete.skillLevel}
                </span>
              </div>

              <p className="text-xs font-mono text-zinc-400">
                {athlete.sport} • {athlete.specialization}
              </p>

              <div className="flex items-center space-x-3 text-xs text-brand-muted font-mono pt-1">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{athlete.location}</span>
                </div>
                <span>•</span>
                <div>Age {athlete.age > 0 ? athlete.age : '—'}</div>
                <span>•</span>
                <div className="text-brand-accent font-bold">{athlete.budgetRange}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openPricingModal('general')}
              className={`flex items-center space-x-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                subscription.tier === 'pro'
                  ? 'border-brand-accent/40 bg-brand-accent/15 text-brand-accent shadow-glow-accent'
                  : 'border-white/10 bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{subscription.tier === 'pro' ? 'Athlete Pro' : 'Free Tier (Upgrade)'}</span>
            </button>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/[0.1]"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('discovery')}
              className="flex items-center space-x-1.5 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Explore Coaches</span>
            </button>

            <button
              onClick={() => setIsWellbeingOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-brand-accent bg-brand-accent/10 px-4 py-2.5 text-xs font-semibold text-brand-accent transition hover:bg-brand-accent/20"
            >
              <span>Wellbeing Check-In</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-3"
            >
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
                About
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                "{athlete.bio}"
              </p>
            </motion.div>

            {athlete.goals && athlete.goals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-4"
              >
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                  <Target className="w-5 h-5 text-brand-accent" />
                  <span>Primary Athletic Targets</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {athlete.goals.map((goal, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-brand-dark border border-brand-border/60 flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-brand-accent/20 text-brand-accent mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-white font-medium">{goal}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {athlete.skillProficiency && athlete.skillProficiency.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-brand-accent" />
                    <span>Performance Vector Audit</span>
                  </h2>
                  <span className="text-xs font-mono text-brand-muted">SELF & AUDITED RATING</span>
                </div>

                <div className="space-y-4">
                  {athlete.skillProficiency.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-zinc-200">{skill.name}</span>
                        <span className="text-brand-accent font-bold">{skill.score} / 100</span>
                      </div>
                      <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.score}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-zinc-400 via-white to-brand-accent rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Upcoming sessions</h2>
                  <p className="text-xs text-brand-muted">Join your confirmed consultations right from the dashboard.</p>
                </div>
              </div>
              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-border p-5 text-sm text-brand-muted">No upcoming consultations yet. Book a session to see it appear here.</div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-dark/70 p-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{booking.location || 'Video consultation'}</p>
                        <p className="text-[11px] text-brand-muted">{new Date(booking.startsAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-2.5 py-1 text-[10px] font-semibold text-brand-accent">{booking.status}</span>
                        <button onClick={() => setActiveMeetingBooking(booking)} className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 px-3 py-2 text-[11px] font-semibold text-brand-accent">Join meeting</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <QASection
                initialItems={MOCK_ATHLETE_QA}
                title="Athlete Q&A Bar"
                subtitle="Live profile questions around goals, availability, and training preferences."
                roleName="Athlete"
              />
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {athlete.achievements && athlete.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="glass-panel p-6 rounded-3xl border border-brand-border space-y-4"
              >
                <h3 className="font-extrabold text-white text-base uppercase flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Career Highlights</span>
                </h3>
                <div className="space-y-2.5">
                  {athlete.achievements.map((ach, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-brand-dark border border-brand-border text-xs text-zinc-300 font-medium">
                      🏆 {ach}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <WellbeingModal
        isOpen={isWellbeingOpen}
        onClose={() => setIsWellbeingOpen(false)}
        onSubmitWellbeing={(tag, note) => {
          addNotification({
            type: 'info',
            title: 'Wellbeing check-in submitted',
            message: `Your ${tag} note has been saved. A coach can follow up if needed.`,
          });
        }}
      />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <VideoMeetingModal booking={activeMeetingBooking} onClose={() => setActiveMeetingBooking(null)} />
    </div>
  );
};
