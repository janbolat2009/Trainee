import type { AthleteProgressLog, CoachStudent, ProgressFlag } from '../types';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v : fallback;

const num = (v: unknown): number | null =>
  typeof v === 'number' ? v : null;

const normalizeLog = (row: Row): AthleteProgressLog => ({
  id: str(row.id),
  athleteId: str(row.athlete_id),
  coachId: str(row.coach_id),
  loggedAt: str(row.logged_at),
  metricType: str(row.metric_type, 'general'),
  value: num(row.value),
  notes: typeof row.notes === 'string' ? row.notes : null,
  mood: typeof row.mood === 'string' ? row.mood : null,
  wellbeing: typeof row.wellbeing === 'number' ? row.wellbeing : null,
  fatigue: typeof row.fatigue === 'number' ? row.fatigue : null,
  painLevel: typeof row.pain_level === 'number' ? row.pain_level : null,
  sleepHours: typeof row.sleep_hours === 'number' ? row.sleep_hours : null,
  flag: (str(row.flag, 'normal')) as ProgressFlag,
});

const normalizeStudent = (row: Row): CoachStudent => ({
  athleteId: str(row.id),
  name: str(row.name, 'Athlete'),
  avatar: typeof row.avatar === 'string' ? row.avatar : null,
  sport: typeof row.sport === 'string' ? row.sport : null,
  joinedAt: str(row.created_at),
});

// ── Progress Logs ─────────────────────────────────────────────────────────────

export const fetchStudentLogs = async (
  coachProfileId: string,
  athleteProfileId?: string,
): Promise<AthleteProgressLog[]> => {
  if (!supabase) return [];
  let query = supabase
    .from('athlete_progress_logs')
    .select('*')
    .eq('coach_id', coachProfileId)
    .order('logged_at', { ascending: false });
  if (athleteProfileId) query = query.eq('athlete_id', athleteProfileId);
  const { data, error } = await query;
  if (error) { console.error('fetchStudentLogs:', error.message); return []; }
  return (data ?? []).map((r) => normalizeLog(r as Row));
};

export type CreateLogPayload = {
  athleteId: string;
  // Опционально: если не передан, coach_id автоматически резолвится
  // триггером БД (set_progress_log_coach_id) по принятой заявке тренера.
  coachId?: string;
  metricType: string;
  value?: number;
  notes?: string;
  mood?: string;
  wellbeing?: number;
  fatigue?: number;
  painLevel?: number;
  sleepHours?: number;
};

// Теги настроения, требующие внимания тренера, даже без числовых метрик
const MOOD_ATTENTION_TAGS = new Set(['sadness', 'apathy']);

export const createProgressLog = async (payload: CreateLogPayload): Promise<AthleteProgressLog | null> => {
  if (!supabase) return null;

  // Auto-flag based on pain, fatigue, or a concerning mood tag
  let flag: ProgressFlag = 'normal';
  if ((payload.painLevel ?? 0) >= 7 || (payload.fatigue ?? 0) >= 8) flag = 'risk';
  else if ((payload.painLevel ?? 0) >= 4 || (payload.fatigue ?? 0) >= 6) flag = 'attention';
  else if (payload.mood && MOOD_ATTENTION_TAGS.has(payload.mood)) flag = 'attention';

  const insertPayload: Record<string, unknown> = {
    athlete_id: payload.athleteId,
    metric_type: payload.metricType,
    value: payload.value ?? null,
    notes: payload.notes ?? null,
    mood: payload.mood ?? null,
    wellbeing: payload.wellbeing ?? null,
    fatigue: payload.fatigue ?? null,
    pain_level: payload.painLevel ?? null,
    sleep_hours: payload.sleepHours ?? null,
    flag,
  };
  // coach_id намеренно не отправляем, если не передан явно — БД сама
  // подставит его через триггер на основании принятой заявки тренера.
  if (payload.coachId) insertPayload.coach_id = payload.coachId;

  const { data, error } = await supabase
    .from('athlete_progress_logs')
    .insert(insertPayload)
    .select()
    .single();
  if (error) { console.error('createProgressLog:', error.message); return null; }
  return normalizeLog(data as Row);
};

// Специальный хелпер для Well-being Survey. Привязка к тренеру и
// timestamp (logged_at default now()) обрабатываются автоматически —
// вызывающему коду нужен только athleteId, mood и опциональная заметка.
export const createWellbeingCheckIn = async (params: {
  athleteId: string;
  mood: string;
  note?: string;
}): Promise<AthleteProgressLog | null> => {
  return createProgressLog({
    athleteId: params.athleteId,
    metricType: 'wellbeing_checkin',
    mood: params.mood,
    notes: params.note && params.note.length > 0 ? params.note : undefined,
  });
};

// ── Students (accepted applications → linked athletes) ────────────────────────

export const fetchCoachStudents = async (coachProfileId: string): Promise<CoachStudent[]> => {
  if (!supabase) return [];
  // Students are athletes whose application was accepted
  const { data, error } = await supabase
    .from('listing_applications')
    .select('athlete_id, athlete_name, athlete_avatar, created_at, profiles!listing_applications_athlete_id_fkey(sport)')
    .eq('coach_id', coachProfileId)
    .eq('status', 'accepted');

  if (error) {
    // Fallback: simple join may not be supported depending on schema; do separate query
    console.warn('fetchCoachStudents (join):', error.message);
    const { data: apps, error: appsErr } = await supabase
      .from('listing_applications')
      .select('athlete_id, athlete_name, athlete_avatar, created_at')
      .eq('coach_id', coachProfileId)
      .eq('status', 'accepted');
    if (appsErr) return [];
    return (apps ?? []).map((r) => ({
      athleteId: str((r as Row).athlete_id),
      name: str((r as Row).athlete_name, 'Athlete'),
      avatar: typeof (r as Row).athlete_avatar === 'string' ? (r as Row).athlete_avatar as string : null,
      sport: null,
      joinedAt: str((r as Row).created_at),
    }));
  }

  return (data ?? []).map((r) => {
    const row = r as Row;
    return {
      athleteId: str(row.athlete_id),
      name: str(row.athlete_name, 'Athlete'),
      avatar: typeof row.athlete_avatar === 'string' ? row.athlete_avatar : null,
      sport: null,
      joinedAt: str(row.created_at),
    };
  });
};

// ── Realtime ──────────────────────────────────────────────────────────────────

export const subscribeToStudentProgress = (
  coachProfileId: string,
  onNewLog: (log: AthleteProgressLog) => void,
): RealtimeChannel | null => {
  if (!supabase) return null;

  const channel = supabase
    .channel(`coach-progress-${coachProfileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'athlete_progress_logs',
        filter: `coach_id=eq.${coachProfileId}`,
      },
      (payload) => {
        const log = normalizeLog(payload.new as Row);
        onNewLog(log);
      },
    )
    .subscribe();

  return channel;
};

export const unsubscribeChannel = (channel: RealtimeChannel | null) => {
  if (!supabase || !channel) return;
  void supabase.removeChannel(channel);
};