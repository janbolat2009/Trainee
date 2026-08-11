import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Activity, Moon, Heart, Zap,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, Wifi,
} from 'lucide-react';
import {
  fetchCoachStudents,
  fetchStudentLogs,
  subscribeToStudentProgress,
  unsubscribeChannel,
} from '../../services/progressService';
import type { CoachStudent, AthleteProgressLog } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#e2e8f0' }) => {
  if (data.length < 2) return null;
  const w = 100; const h = 30;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-7 shrink-0" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Flag Badge ─────────────────────────────────────────────────────────────────

const FlagBadge: React.FC<{ flag: AthleteProgressLog['flag'] }> = ({ flag }) => {
  if (flag === 'normal') return null;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      flag === 'risk' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-400/20 text-amber-400 border-amber-400/30'
    }`}>
      <AlertTriangle className="w-3 h-3" />
      {flag === 'risk' ? 'Risk' : 'Attention'}
    </span>
  );
};

// ── Student Card ──────────────────────────────────────────────────────────────

const StudentCard: React.FC<{ student: CoachStudent; coachProfileId: string; isRealtime: boolean }> = ({
  student, coachProfileId, isRealtime,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<AthleteProgressLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const data = await fetchStudentLogs(coachProfileId, student.athleteId);
    setLogs(data);
    setIsLoadingLogs(false);
  };

  const handleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && logs.length === 0) void loadLogs();
  };

  const latestLog = logs[0];
  const wellbeingData = logs.slice(0, 7).map((l) => l.wellbeing ?? 5).reverse();
  const hasFlaggedLog = logs.some((l) => l.flag !== 'normal');

  return (
    <motion.div
      layout
      className={`glass-panel rounded-2xl border transition overflow-hidden ${
        hasFlaggedLog ? 'border-amber-400/30' : 'border-brand-border'
      }`}
    >
      {/* Student Header Row */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition"
      >
        {student.avatar ? (
          <img src={student.avatar} alt={student.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-brand-elevated border border-brand-border flex items-center justify-center text-zinc-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{student.name}</span>
            {hasFlaggedLog && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          {student.sport && <div className="text-xs text-brand-muted">{student.sport}</div>}
          {latestLog && (
            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
              Last log: {new Date(latestLog.loggedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {wellbeingData.length > 1 && (
          <Sparkline
            data={wellbeingData}
            color={hasFlaggedLog ? '#f59e0b' : '#22c55e'}
          />
        )}

        {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-brand-muted shrink-0" />}
      </button>

      {/* Expanded Progress Logs */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-brand-border/60 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {isLoadingLogs ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-brand-dark border border-brand-border animate-pulse" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Activity className="w-7 h-7 text-brand-muted mx-auto" />
                  <p className="text-xs text-brand-muted">No progress logs yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        log.flag === 'risk' ? 'bg-red-500/5 border-red-500/20' :
                        log.flag === 'attention' ? 'bg-amber-400/5 border-amber-400/20' :
                        'bg-brand-dark border-brand-border/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200 capitalize">{log.metricType}</span>
                          <FlagBadge flag={log.flag} />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(log.loggedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Metrics grid */}
                      <div className="flex flex-wrap gap-3 font-mono text-[11px]">
                        {log.wellbeing !== null && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Heart className="w-3 h-3" />
                            Well {log.wellbeing}/10
                          </span>
                        )}
                        {log.fatigue !== null && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Zap className="w-3 h-3" />
                            Fatigue {log.fatigue}/10
                          </span>
                        )}
                        {log.painLevel !== null && (
                          <span className={`flex items-center gap-1 ${log.painLevel >= 7 ? 'text-red-400' : 'text-zinc-400'}`}>
                            <Activity className="w-3 h-3" />
                            Pain {log.painLevel}/10
                          </span>
                        )}
                        {log.sleepHours !== null && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Moon className="w-3 h-3" />
                            {log.sleepHours}h sleep
                          </span>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-zinc-400 leading-relaxed">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { ProGateBanner } from '../Subscription/ProGateBanner';

// ── Main View ──────────────────────────────────────────────────────────────────

export const CoachStudentsView: React.FC = () => {
  const { currentProfile, addNotification } = useApp();
  const [students, setStudents] = useState<CoachStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const coachProfileId = currentProfile?.profile.id ?? '';

  const load = async () => {
    if (!coachProfileId) return;
    setIsLoading(true);
    const data = await fetchCoachStudents(coachProfileId);
    setStudents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
    return () => { unsubscribeChannel(channelRef.current); };
  }, [coachProfileId]);

  // Subscribe to Realtime
  useEffect(() => {
    if (!coachProfileId) return;
    const channel = subscribeToStudentProgress(coachProfileId, (log) => {
      // Notify coach on new log
      const flag = log.flag;
      if (flag === 'risk') {
        addNotification({
          type: 'risk',
          title: '🚨 Risk alert',
          message: `A student logged a concerning entry (pain: ${log.painLevel ?? '?'}/10, fatigue: ${log.fatigue ?? '?'}/10).`,
        });
      } else if (flag === 'attention') {
        addNotification({
          type: 'warning',
          title: '⚠️ Attention needed',
          message: 'A student logged elevated fatigue or discomfort.',
        });
      } else {
        addNotification({
          type: 'info',
          title: 'New progress log',
          message: 'A student recorded new training data.',
        });
      }
    });
    channelRef.current = channel;
    setIsRealtime(Boolean(channel));
  }, [coachProfileId]);

  return (
    <div className="liquid-shell min-h-screen pb-24 pt-10 sm:pt-14">
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="section-eyebrow mb-1">Students</p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">My Students</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-zinc-400">
                {students.length} active athletes
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase bg-brand-accent/20 text-brand-accent border-brand-accent/30">
                Unlimited Capacity
              </span>
              {isRealtime && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border text-brand-muted hover:text-white hover:bg-white/10 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Info banner about Realtime */}
        {isRealtime && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300"
          >
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Real-time monitoring active — you'll be notified instantly when students log new progress or health alerts.</span>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-brand-card border border-brand-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && students.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-10 rounded-3xl border border-brand-border text-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
              <Users className="w-7 h-7" />
            </div>
            <div className="font-semibold text-white">No students yet</div>
            <p className="text-xs text-brand-muted max-w-xs mx-auto">
              When you accept an athlete's application, they'll appear here with their progress logs.
            </p>
          </motion.div>
        )}

        {/* Student List */}
        {!isLoading && students.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {students.map((student) => (
              <StudentCard
                key={student.athleteId}
                student={student}
                coachProfileId={coachProfileId}
                isRealtime={isRealtime}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
