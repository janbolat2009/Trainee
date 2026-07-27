import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_SESSIONS, MOCK_IMPROVEMENTS } from '../../data/mockData';
import { DashboardSession } from '../../types';
import { Activity, Calendar, Clock, TrendingUp, Zap, ShieldCheck, ArrowRight, Play, CheckCircle2, Award, ChevronRight, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardSection: React.FC = () => {
  const { viewCoachDetails, coachesList, setActiveTab } = useApp();
  const [activeTab, setActiveDashboardTab] = useState<'sessions' | 'improvements' | 'milestones'>('sessions');
  const [sessions, setSessions] = useState<DashboardSession[]>(MOCK_SESSIONS);
  const [completedNotice, setCompletedNotice] = useState<string | null>(null);

  const handleMarkComplete = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'Completed' } : s));
    setCompletedNotice('Session marked as completed! Metrics updated in your dashboard.');
    setTimeout(() => setCompletedNotice(null), 3000);
  };

  return (
    <section className="relative border-b border-white/[0.07] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="section-eyebrow mb-3">Training overview</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Keep the important work in view.</h2>
            <p className="mt-2 text-sm text-zinc-400">Your upcoming sessions and the progress you have earned.</p>
          </div>

          <div className="flex items-center space-x-2 p-1 rounded-2xl bg-brand-card border border-brand-border self-start md:self-auto">
            <button
              onClick={() => setActiveDashboardTab('sessions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'sessions'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Sessions Matrix</span>
            </button>
            <button
              onClick={() => setActiveDashboardTab('improvements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'improvements'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-brand-accent" />
              <span>Performance Gains</span>
            </button>
            <button
              onClick={() => setActiveDashboardTab('milestones')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'milestones'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-brand-muted hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Milestones</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-panel p-5 rounded-2xl border border-brand-border flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-mono uppercase text-brand-muted">Active Sessions</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">28</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">+4 this month</div>
            </div>
            <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border text-white">
              <Calendar className="w-5 h-5 text-brand-accent" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="glass-panel p-5 rounded-2xl border border-brand-border flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-mono uppercase text-brand-muted">Training Hours</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">42.5h</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">+12% vs last month</div>
            </div>
            <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border text-white">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="glass-panel p-5 rounded-2xl border border-brand-border flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-mono uppercase text-brand-muted">Performance Gain</div>
              <div className="text-2xl sm:text-3xl font-black text-brand-accent font-mono mt-1">+18.5%</div>
              <div className="text-[10px] text-brand-accent font-mono mt-1">AI Verified Metric</div>
            </div>
            <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border text-white">
              <Zap className="w-5 h-5 text-brand-accent" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="glass-panel p-5 rounded-2xl border border-brand-border flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-mono uppercase text-brand-muted">Skill Velocity</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">94/100</div>
              <div className="text-[10px] text-amber-400 font-mono mt-1">Elite Tier Ranking</div>
            </div>
            <div className="p-3 rounded-xl bg-brand-elevated border border-brand-border text-white">
              <BarChart2 className="w-5 h-5 text-amber-400" />
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {completedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 mb-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{completedNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ y: -2 }}
                    className="glass-panel p-6 rounded-3xl border border-brand-border flex flex-col justify-between space-y-4 hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          session.status === 'In Progress'
                            ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 animate-pulse'
                            : session.status === 'Upcoming'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {session.status}
                        </span>
                        <div className="flex items-center space-x-1.5 text-xs font-mono text-brand-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{session.date}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-base leading-snug mb-2">
                        {session.title}
                      </h3>

                      <div className="flex items-center space-x-3 p-3 rounded-2xl bg-brand-dark/60 border border-brand-border/60 mb-3">
                        <img 
                          src={session.coachAvatar} 
                          alt={session.coachName} 
                          className="w-10 h-10 rounded-xl object-cover border border-brand-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-xs truncate">{session.coachName}</div>
                          <div className="text-[10px] text-brand-muted font-mono">{session.sport} Specialist</div>
                        </div>
                        <button
                          onClick={() => {
                            const found = coachesList.find(c => c.name === session.coachName);
                            if (found) viewCoachDetails(found);
                          }}
                          className="p-1.5 rounded-lg bg-brand-card hover:bg-white/10 text-brand-muted hover:text-white transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-brand-card border border-brand-border/40">
                          <div className="text-[10px] text-brand-muted">FOCUS AREA</div>
                          <div className="text-zinc-200 font-medium truncate mt-0.5">{session.focusArea}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-brand-card border border-brand-border/40">
                          <div className="text-[10px] text-brand-muted">IMPROVEMENT DELTA</div>
                          <div className="text-brand-accent font-bold truncate mt-0.5">{session.improvementDelta}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-zinc-400">
                        Duration: <strong className="text-white">{session.duration}</strong>
                      </div>
                      {session.status === 'In Progress' ? (
                        <button
                          onClick={() => handleMarkComplete(session.id)}
                          className="px-4 py-2 rounded-xl bg-brand-accent text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-accentHover transition flex items-center space-x-1.5 shadow-glow-accent"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>Join Live Session</span>
                        </button>
                      ) : session.status === 'Upcoming' ? (
                        <button
                          onClick={() => handleMarkComplete(session.id)}
                          className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition"
                        >
                          <span>Confirm Readiness</span>
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed Audit Verified</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'improvements' && (
            <motion.div
              key="improvements"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border space-y-6"
            >
              <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">
                    Biomechanical Improvement Metrics
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Data tracked across high-speed video audits & sensor kinetics.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent font-mono text-xs font-bold">
                  AVG GAIN +18.7%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_IMPROVEMENTS.map((metric, idx) => (
                  <div key={metric.category} className="p-5 rounded-2xl bg-brand-dark border border-brand-border/60 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white uppercase">{metric.category}</span>
                      <span className="text-brand-accent font-bold">+{metric.percentageGain}%</span>
                    </div>

                    <div className="flex items-baseline justify-between font-mono">
                      <div className="text-2xl font-extrabold text-white">
                        {metric.currentValue}
                      </div>
                      <div className="text-xs text-brand-muted line-through">
                        was {metric.previousValue}
                      </div>
                    </div>

                    <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(metric.percentageGain * 4, 100)}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full bg-gradient-to-r from-zinc-500 via-white to-brand-accent rounded-full"
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              <div className="glass-panel p-6 rounded-3xl border border-brand-border text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">Acceleration Master</h4>
                <p className="text-xs text-brand-muted">Unlocked after completing 10 high-speed drive phase sprint sessions.</p>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 font-mono text-[10px] font-bold">UNLOCKED</span>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-brand-border text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center mx-auto text-brand-accent">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">Sub-10.40s PB Barrier</h4>
                <p className="text-xs text-brand-muted">Official electronic timing verification in regional championships.</p>
                <span className="inline-block px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent font-mono text-[10px] font-bold">VERIFIED</span>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-brand-border text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">100% Session Attendance</h4>
                <p className="text-xs text-brand-muted">Perfect track record across 28 consecutive scheduled sessions.</p>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">ACHIEVED</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <button
            onClick={() => setActiveTab('matchmaking')}
            className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/[0.09]"
          >
            <span>Find your next session</span>
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </button>
        </div>

      </div>
    </section>
  );
};
