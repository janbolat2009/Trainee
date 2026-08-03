import React, { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Smile, Zap, CloudRain, Moon, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  fetchCoachStudents,
  fetchStudentLogs,
  subscribeToStudentProgress,
  unsubscribeChannel,
} from '../../services/progressService';
import type { AthleteProgressLog, CoachStudent } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MOOD_META: Record<string, { label: string; icon: typeof Zap }> = {
  fatigue: { label: 'Fatigue', icon: Zap },
  tiredness: { label: 'Tiredness', icon: Moon },
  sadness: { label: 'Sadness', icon: CloudRain },
  apathy: { label: 'Apathy', icon: HeartPulse },
  motivation: { label: 'Motivation', icon: Smile },
};

const FLAG_STYLES: Record<string, string> = {
  normal: 'border-white/10 bg-white/5 text-brand-muted',
  attention: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  risk: 'border-red-500/40 bg-red-500/10 text-red-400',
};

export const WellbeingCheckIns: React.FC = () => {
  const { currentProfile } = useApp();
  const coachId = currentProfile?.role === 'coach' ? currentProfile.profile.id : null;

  const [logs, setLogs] = useState<AthleteProgressLog[]>([]);
  const [students, setStudents] = useState<Record<string, CoachStudent>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!coachId) return;
    let channel: RealtimeChannel | null = null;

    (async () => {
      setIsLoading(true);
      const [studentList, allLogs] = await Promise.all([
        fetchCoachStudents(coachId),
        fetchStudentLogs(coachId),
      ]);

      const studentMap: Record<string, CoachStudent> = {};
      studentList.forEach((s) => { studentMap[s.athleteId] = s; });
      setStudents(studentMap);
      setLogs(allLogs.filter((l) => l.metricType === 'wellbeing_checkin'));
      setIsLoading(false);

      // Realtime: новые чек-ины появляются без ручного рефреша
      channel = subscribeToStudentProgress(coachId, (log) => {
        if (log.metricType !== 'wellbeing_checkin') return;
        setLogs((prev) => [log, ...prev]);
      });
    })();

    return () => unsubscribeChannel(channel);
  }, [coachId]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()),
    [logs],
  );

  if (!coachId) return null;

  return (
    <div className="glass-panel rounded-3xl border border-brand-border p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Athlete well-being check-ins</h2>
        <p className="text-xs text-brand-muted">Live updates as your athletes submit how they're feeling.</p>
      </div>

      {isLoading && <p className="text-xs text-brand-muted">Loading check-ins…</p>}

      {!isLoading && sortedLogs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-border p-5 text-sm text-brand-muted">
          No check-ins yet.
        </div>
      )}

      <div className="space-y-3">
        {sortedLogs.map((log) => {
          const mood = log.mood ? MOOD_META[log.mood] : null;
          const Icon = mood?.icon ?? HeartPulse;
          const athlete = students[log.athleteId];

          return (
            <div key={log.id} className="flex items-start justify-between gap-3 rounded-2xl border border-brand-border bg-brand-dark/70 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-brand-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{athlete?.name ?? 'Athlete'}</p>
                  <p className="text-xs text-brand-muted">{mood?.label ?? 'Check-in'}</p>
                  {log.notes && <p className="mt-1 text-xs text-zinc-300">{log.notes}</p>}
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {new Date(log.loggedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${FLAG_STYLES[log.flag] ?? FLAG_STYLES.normal}`}>
                {log.flag === 'risk' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                {log.flag}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};