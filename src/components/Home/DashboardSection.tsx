import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_SESSIONS, MOCK_IMPROVEMENTS } from '../../data/mockData';
import { DashboardSession } from '../../types';
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
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardSection: React.FC = () => {
  const { viewCoachDetails, coachesList, setActiveTab } = useApp();
  const [activeTab, setActiveDashboardTab] = useState<'sessions' | 'improvements' | 'milestones'>('sessions');
  const [sessions, setSessions] = useState<DashboardSession[]>(MOCK_SESSIONS);
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  const handleMarkComplete = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'Completed' } : s))
    );
    setCompletedNotice('Session marked as completed.');
    setTimeout(() => setCompletedNotice(null), 2800);
  };

  return (
    <section className="relative border-b border-white/[0.06] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-500 mb-2">
              Training overview
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Keep the important work in view
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Upcoming sessions and the progress you have earned.
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
              value: '28',
              sub: '+4 this month',
              subColor: 'text-emerald-400',
              icon: Calendar,
              iconColor: 'text-brand-accent',
            },
            {
              label: 'Training Hours',
              value: '42.5h',
              sub: '+12% vs last month',
              subColor: 'text-emerald-400',
              icon: Clock,
              iconColor: 'text-zinc-300',
            },
            {
              label: 'Performance Gain',
              value: '+18.5%',
              sub: 'AI Verified',
              subColor: 'text-brand-accent',
              icon: Zap,
              iconColor: 'text-brand-accent',
            },
            {
              label: 'Skill Velocity',
              value: '94/100',
              sub: 'Elite Tier',
              subColor: 'text-amber-400',
              icon: BarChart2,
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
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
                        <span>{session.date}</span>
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
                          {session.sport} Specialist
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const found = coachesList.find(
                            (c) => c.name === session.coachName
                          );
                          if (found) viewCoachDetails(found);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-zinc-800/40 border border-white/[0.04] p-2.5">
                        <div className="text-[10px] text-zinc-500 mb-0.5">
                          Focus
                        </div>
                        <div className="text-zinc-200 truncate">
                          {session.focusArea}
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-800/40 border border-white/[0.04] p-2.5">
                        <div className="text-[10px] text-zinc-500 mb-0.5">
                          Delta
                        </div>
                        <div className="text-brand-accent font-medium truncate">
                          {session.improvementDelta}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="text-xs text-zinc-500">
                      Duration:{' '}
                      <span className="text-zinc-300">{session.duration}</span>
                    </div>

                    {session.status === 'In Progress' ? (
                      <button
                        onClick={() => handleMarkComplete(session.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-accent text-black text-xs font-semibold hover:opacity-90 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        Join
                      </button>
                    ) : session.status === 'Upcoming' ? (
                      <button
                        onClick={() => handleMarkComplete(session.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition"
                      >
                        Confirm
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
                    Biomechanical Metrics
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tracked across video audits & sensor data
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-medium">
                  Avg +18.7%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_IMPROVEMENTS.map((metric, idx) => (
                  <div
                    key={metric.category}
                    className="rounded-xl border border-white/[0.04] bg-zinc-800/40 p-4"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-zinc-300 uppercase tracking-wide">
                        {metric.category}
                      </span>
                      <span className="text-brand-accent font-medium">
                        +{metric.percentageGain}%
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xl font-semibold text-white tabular-nums">
                        {metric.currentValue}
                      </span>
                      <span className="text-xs text-zinc-500 line-through">
                        {metric.previousValue}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-700/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(metric.percentageGain * 4, 100)}%`,
                        }}
                        transition={{ duration: 0.7, delay: idx * 0.08 }}
                        className="h-full rounded-full bg-brand-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
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
                  icon: Award,
                  iconBg: 'bg-amber-400/15',
                  iconColor: 'text-amber-400',
                  title: 'Acceleration Master',
                  desc: 'Unlocked after 10 high-speed drive phase sprint sessions.',
                  badge: 'Unlocked',
                  badgeColor: 'text-amber-400 bg-amber-400/10',
                },
                {
                  icon: Zap,
                  iconBg: 'bg-brand-accent/15',
                  iconColor: 'text-brand-accent',
                  title: 'Sub-10.40s PB Barrier',
                  desc: 'Official electronic timing verification in regional championships.',
                  badge: 'Verified',
                  badgeColor: 'text-brand-accent bg-brand-accent/10',
                },
                {
                  icon: ShieldCheck,
                  iconBg: 'bg-emerald-500/15',
                  iconColor: 'text-emerald-400',
                  title: '100% Session Attendance',
                  desc: 'Perfect track record across 28 consecutive scheduled sessions.',
                  badge: 'Achieved',
                  badgeColor: 'text-emerald-400 bg-emerald-500/10',
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
            onClick={() => setActiveTab('matchmaking')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] transition"
          >
            <span>Find your next session</span>
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </button>
        </div>
      </div>
    </section>
  );
};