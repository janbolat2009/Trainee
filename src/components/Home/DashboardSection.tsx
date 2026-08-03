import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { DashboardSession, ConsultationBooking, AthleteProgressLog } from '../../types';
import { fetchAthleteBookings, fetchCoachBookings } from '../../services/bookingService';
import { fetchStudentLogs } from '../../services/progressService';
import {
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  ShieldCheck,
  ArrowRight,
  Play,
  CheckCircle2,
  Award,
  BarChart2,
  Search,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardSection: React.FC = () => {
  const { setActiveTab, currentProfile, isAuthenticated, setIsLoginOpen, setIsOnboardingOpen } = useApp();
  const [activeTab, setActiveDashboardTab] = useState<'sessions' | 'improvements' | 'milestones'>('sessions');
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [progressLogs, setProgressLogs] = useState<AthleteProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  const profileId = currentProfile?.profile?.id;
  const isAthlete = currentProfile?.role === 'athlete';
  const isCoach = currentProfile?.role === 'coach';

  useEffect(() => {
    if (!isAuthenticated || !profileId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        if (isAthlete) {
          const b = await fetchAthleteBookings(profileId);
          if (isMounted) setBookings(b);
        } else if (isCoach) {
          const [b, logs] = await Promise.all([
            fetchCoachBookings(profileId),
            fetchStudentLogs(profileId),
          ]);
          if (isMounted) {
            setBookings(b);
            setProgressLogs(logs);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDashboardData();
    return () => { isMounted = false; };
  }, [isAuthenticated, profileId, isAthlete, isCoach]);

  const handleMarkComplete = (sessionId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === sessionId ? { ...b, status: 'confirmed' } : b))
    );
    setCompletedNotice('Session status updated.');
    setTimeout(() => setCompletedNotice(null), 2800);
  };

  const sessions: DashboardSession[] = bookings.map((b) => ({
    id: b.id,
    title: `${b.format === 'online' ? 'Online' : 'In-Person'} Consultation`,
    date: new Date(b.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    time: new Date(b.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    coachName: b.coachName || 'Coach',
    coachAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.coachName || b.coachId)}`,
    sport: 'Sports Performance',
    duration: '45 min',
    status: b.status === 'confirmed' ? 'Upcoming' : b.status === 'pending' ? 'In Progress' : 'Completed',
    improvementMetric: 'Consultation',
    improvementDelta: b.status.toUpperCase(),
    focusArea: b.location || 'Video Call Link',
  }));

  const activeSessionsCount = sessions.filter((s) => s.status !== 'Completed').length;
  const completedHours = (sessions.filter((s) => s.status === 'Completed').length * 0.75).toFixed(1);

  return (
    <section className="relative border-b border-white/[0.06] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-500 mb-2">
              Training Overview
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Keep your progress in view
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Real-time consultation sessions, metrics, and milestones.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-zinc-900/80 border border-white/[0.06] self-start">
            {[
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'improvements', label: 'Gains', icon: TrendingUp },
              { id: 'milestones', label: 'Milestones', icon: Award },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveDashboardTab(id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === id
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: 'Active Sessions',
              value: isLoading ? '—' : activeSessionsCount,
              sub: isAuthenticated ? `${sessions.length} total scheduled` : 'Sign in to track',
              subColor: 'text-emerald-400',
              icon: Calendar,
              iconColor: 'text-brand-accent',
            },
            {
              label: 'Training Hours',
              value: isLoading ? '—' : `${completedHours}h`,
              sub: isAuthenticated ? 'Completed sessions' : 'Sign in to track',
              subColor: 'text-emerald-400',
              icon: Clock,
              iconColor: 'text-zinc-300',
            },
            {
              label: 'Performance Logs',
              value: isLoading ? '—' : progressLogs.length,
              sub: progressLogs.length > 0 ? 'Live logs recorded' : 'No logs yet',
              subColor: 'text-brand-accent',
              icon: Zap,
              iconColor: 'text-brand-accent',
            },
            {
              label: 'Account Status',
              value: isAuthenticated ? (currentProfile?.role?.toUpperCase() ?? 'ACTIVE') : 'GUEST',
              sub: isAuthenticated ? 'Verified' : 'Guest access',
              subColor: 'text-amber-400',
              icon: ShieldCheck,
              iconColor: 'text-amber-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-4 flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wide">
                  {stat.label}
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-white mt-0.5 tabular-nums">
                  {stat.value}
                </div>
                <div className={`text-[11px] mt-1 ${stat.subColor}`}>
                  {stat.sub}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center">
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <AnimatePresence>
          {completedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{completedNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-zinc-900/50 border border-white/[0.06] animate-pulse" />
                  ))}
                </div>
              ) : !isAuthenticated ? (
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-8 text-center space-y-4 max-w-md mx-auto">
                  <User className="w-10 h-10 text-brand-accent mx-auto" />
                  <h3 className="text-base font-bold text-white">Track Your Sessions & Progress</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Log in or sign up to schedule consultations with top coaches, view your session history, and track real-time athletic performance metrics.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => setIsOnboardingOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-zinc-500 mx-auto" />
                  <h3 className="text-base font-semibold text-white">No Sessions Scheduled</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    You don't have any upcoming or active sessions right now. Browse our directory of verified coaches to schedule your first session.
                  </p>
                  <button
                    onClick={() => setActiveTab('discovery')}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Browse Verified Coaches</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                              session.status === 'In Progress'
                                ? 'bg-brand-accent/15 text-brand-accent'
                                : session.status === 'Upcoming'
                                ? 'bg-white/10 text-zinc-300'
                                : 'bg-emerald-500/15 text-emerald-400'
                            }`}
                          >
                            {session.status}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.date} • {session.time}</span>
                          </div>
                        </div>

                        <h3 className="text-base font-medium text-white leading-snug mb-3">
                          {session.title}
                        </h3>

                        <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 border border-white/[0.04] p-2.5 mb-3">
                          <img
                            src={session.coachAvatar}
                            alt={session.coachName}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {session.coachName}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {session.sport}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-zinc-800/40 border border-white/[0.04] p-2.5">
                            <div className="text-[10px] text-zinc-500 mb-0.5">
                              Format & Location
                            </div>
                            <div className="text-zinc-200 truncate">
                              {session.focusArea}
                            </div>
                          </div>
                          <div className="rounded-lg bg-zinc-800/40 border border-white/[0.04] p-2.5">
                            <div className="text-[10px] text-zinc-500 mb-0.5">
                              Status
                            </div>
                            <div className="text-brand-accent font-medium truncate">
                              {session.improvementDelta}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                        <div className="text-xs text-zinc-500">
                          Duration: <span className="text-zinc-300">{session.duration}</span>
                        </div>

                        {session.status === 'In Progress' ? (
                          <button
                            onClick={() => handleMarkComplete(session.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-accent text-black text-xs font-semibold hover:opacity-90 transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                            Confirm
                          </button>
                        ) : session.status === 'Upcoming' ? (
                          <span className="flex items-center gap-1 text-xs text-brand-accent">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'improvements' && (
            <motion.div
              key="improvements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Performance Logs & Metrics
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Recorded check-ins & progress updates from Supabase
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-medium">
                  {progressLogs.length} Records
                </span>
              </div>

              {progressLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-400 space-y-2">
                  <BarChart2 className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-white">No Performance Logs Found</p>
                  <p>Check-in notes and progress logs submitted by athletes or coaches will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {progressLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-300 uppercase tracking-wide">
                          {log.metricType}
                        </span>
                        <span className="text-brand-accent font-medium">
                          {log.flag.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {log.notes || 'Progress update recorded'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(log.loggedAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'milestones' && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                {
                  icon: ShieldCheck,
                  iconBg: 'bg-emerald-500/15',
                  iconColor: 'text-emerald-400',
                  title: 'Account Registered',
                  desc: isAuthenticated ? 'Official Trainee profile created and verified.' : 'Register an account to unlock profile milestones.',
                  badge: isAuthenticated ? 'Achieved' : 'Locked',
                  badgeColor: isAuthenticated ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800',
                },
                {
                  icon: Calendar,
                  iconBg: 'bg-brand-accent/15',
                  iconColor: 'text-brand-accent',
                  title: 'First Consultation',
                  desc: sessions.length > 0 ? `${sessions.length} consultation sessions scheduled on Trainee.` : 'Schedule your first session with a coach.',
                  badge: sessions.length > 0 ? 'Unlocked' : 'In Progress',
                  badgeColor: sessions.length > 0 ? 'text-brand-accent bg-brand-accent/10' : 'text-zinc-400 bg-zinc-800',
                },
                {
                  icon: Award,
                  iconBg: 'bg-amber-400/15',
                  iconColor: 'text-amber-400',
                  title: 'Verified Profile',
                  desc: 'Complete profile configuration and well-being check-ins.',
                  badge: currentProfile ? 'Active' : 'Pending',
                  badgeColor: currentProfile ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-500 bg-zinc-800',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-5 text-center"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center mx-auto mb-3`}
                  >
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setActiveTab('discovery')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition"
          >
            <span>Explore all verified coaches</span>
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </button>
        </div>
      </div>
    </section>
  );
};