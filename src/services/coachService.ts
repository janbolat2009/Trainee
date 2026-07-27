import type { AthleteProgressLog, CoachListing, CoachStudent, ListingApplication, ListingStatus, TrainingFormat } from '../types';
import { supabase } from '../lib/supabase';

type Row = Record<string, unknown>;
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const numeric = (value: unknown): number | null => typeof value === 'number' ? value : null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toListing = (row: Row): CoachListing => ({
  id: text(row.id), coachId: text(row.coach_id), sport: text(row.sport), specialization: text(row.specialization), athleteLevel: text(row.athlete_level),
  trainingFormat: text(row.training_format, 'hybrid') as TrainingFormat, price: typeof row.price === 'number' ? row.price : 0,
  billingPeriod: text(row.billing_period, 'session') as CoachListing['billingPeriod'], description: text(row.description), coachingStyle: text(row.coaching_style),
  achievements: strings(row.achievements), location: typeof row.location === 'string' ? row.location : null, mediaUrls: strings(row.media_urls),
  status: text(row.status, 'active') as ListingStatus, createdAt: text(row.created_at),
});

const toProgress = (row: Row): AthleteProgressLog => ({
  id: text(row.id), athleteId: text(row.athlete_id), coachId: text(row.coach_id), loggedAt: text(row.logged_at), metricType: text(row.metric_type),
  value: numeric(row.value), notes: typeof row.notes === 'string' ? row.notes : null, wellbeing: numeric(row.wellbeing), fatigue: numeric(row.fatigue),
  painLevel: numeric(row.pain_level), sleepHours: numeric(row.sleep_hours), flag: text(row.flag, 'normal') as AthleteProgressLog['flag'],
});

export type ListingDraft = Omit<CoachListing, 'id' | 'coachId' | 'createdAt' | 'mediaUrls'> & { mediaUrls?: string[] };

export const getCoachWorkspace = async (coachId: string) => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [listingsResult, applicationsResult, studentsResult, progressResult] = await Promise.all([
    supabase.from('coach_listings').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
    supabase.from('coach_listing_applications').select('*, athlete:profiles!coach_listing_applications_athlete_id_fkey(name, avatar)').eq('coach_id', coachId).order('created_at', { ascending: false }),
    supabase.from('coach_athletes').select('athlete_id, joined_at, athlete:profiles!coach_athletes_athlete_id_fkey(name, avatar, sport)').eq('coach_id', coachId).order('joined_at', { ascending: false }),
    supabase.from('athlete_progress_logs').select('*').eq('coach_id', coachId).order('logged_at', { ascending: false }).limit(100),
  ]);
  for (const result of [listingsResult, applicationsResult, studentsResult, progressResult]) if (result.error) throw new Error(result.error.message);
  const applications = (applicationsResult.data ?? []).map((row) => {
    const item = row as Row; const athlete = item.athlete as Row | null;
    return { id: text(item.id), listingId: text(item.listing_id), coachId: text(item.coach_id), athleteId: text(item.athlete_id), athleteName: text(athlete?.name, 'Athlete'), athleteAvatar: typeof athlete?.avatar === 'string' ? athlete.avatar : null, message: text(item.message), status: text(item.status, 'pending') as ListingApplication['status'], createdAt: text(item.created_at) };
  });
  const students = (studentsResult.data ?? []).map((row) => {
    const item = row as Row; const athlete = item.athlete as Row | null;
    return { athleteId: text(item.athlete_id), name: text(athlete?.name, 'Athlete'), avatar: typeof athlete?.avatar === 'string' ? athlete.avatar : null, sport: typeof athlete?.sport === 'string' ? athlete.sport : null, joinedAt: text(item.joined_at) } as CoachStudent;
  });
  return { listings: (listingsResult.data ?? []).map((row) => toListing(row as Row)), applications, students, progress: (progressResult.data ?? []).map((row) => toProgress(row as Row)) };
};

export const saveCoachListing = async (coachId: string, draft: ListingDraft, listingId?: string) => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const payload = { coach_id: coachId, sport: draft.sport, specialization: draft.specialization, athlete_level: draft.athleteLevel, training_format: draft.trainingFormat, price: draft.price, billing_period: draft.billingPeriod, description: draft.description, coaching_style: draft.coachingStyle, achievements: draft.achievements, location: draft.location, media_urls: draft.mediaUrls ?? [], status: draft.status };
  const { error } = listingId ? await supabase.from('coach_listings').update(payload).eq('id', listingId) : await supabase.from('coach_listings').insert(payload);
  if (error) throw new Error(error.message);
};

export const removeCoachListing = async (listingId: string) => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('coach_listings').delete().eq('id', listingId);
  if (error) throw new Error(error.message);
};

export const respondToApplication = async (application: ListingApplication, status: 'accepted' | 'declined') => {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('coach_listing_applications').update({ status }).eq('id', application.id);
  if (error) throw new Error(error.message);
  if (status === 'accepted') {
    const { error: relationError } = await supabase.from('coach_athletes').upsert({ coach_id: application.coachId, athlete_id: application.athleteId }, { onConflict: 'coach_id,athlete_id' });
    if (relationError) throw new Error(relationError.message);
  }
};

export const subscribeToCoachWorkspace = (coachId: string, refresh: () => void) => {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel = client.channel(`coach-workspace-${coachId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_listing_applications', filter: `coach_id=eq.${coachId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'athlete_progress_logs', filter: `coach_id=eq.${coachId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_listings', filter: `coach_id=eq.${coachId}` }, refresh)
    .subscribe();
  return () => { void client.removeChannel(channel); };
};
