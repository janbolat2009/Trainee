import { supabase } from '../lib/supabase';
import type { ConsultationBooking, ConsultationSlot, ConsultationFormat } from '../types';

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const bool = (value: unknown): boolean =>
  typeof value === 'boolean' ? value : false;

const iso = (value: unknown): string =>
  typeof value === 'string' ? value : new Date(String(value)).toISOString();

const toSlot = (row: Record<string, unknown>): ConsultationSlot => ({
  id: text(row.id),
  coachId: text(row.coach_id),
  startsAt: iso(row.starts_at),
  endsAt: iso(row.ends_at),
  format: text(row.format, 'online') as ConsultationFormat,
  location: text(row.location, ''),
  isActive: bool(row.is_active),
});

const toBooking = (row: Record<string, unknown>): ConsultationBooking => ({
  id: text(row.id),
  coachId: text(row.coach_id),
  athleteId: text(row.athlete_id),
  athleteName: text(row.athlete_name),
  startsAt: iso(row.starts_at),
  endsAt: iso(row.ends_at),
  format: text(row.format, 'online') as ConsultationFormat,
  location: text(row.location, ''),
  status: text(row.status, 'pending') as ConsultationBooking['status'],
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});

const getBookingErrorMessage = (error: { message?: string } | null, fallback = 'Unable to complete booking request.') => {
  if (error?.message?.includes('Could not find the table')) {
    return 'Booking storage is not set up yet. Run the Supabase migration in supabase/consultation_bookings.sql and reload the app.';
  }

  return error?.message ?? fallback;
};

function buildFallbackSlots(coachId: string, coachLocation?: string | null): ConsultationSlot[] {
  const now = new Date();
  const slots: ConsultationSlot[] = [];

  for (let index = 0; index < 6; index += 1) {
    const start = new Date(now);
    start.setDate(start.getDate() + Math.ceil((index + 1) / 2));
    start.setHours(10 + (index % 2) * 2, 0, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 45);

    slots.push({
      id: `slot-${coachId}-${index}`,
      coachId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      format: index % 2 === 0 ? 'online' : 'offline',
      location: index % 2 === 0 ? 'Video call link provided after booking' : (coachLocation ?? 'Coach location to be shared'),
      isActive: true,
    });
  }

  return slots;
}

export const fetchCoachAvailabilitySlots = async (
  coachId: string,
  coachLocation?: string | null,
): Promise<ConsultationSlot[]> => {
  if (!supabase) {
    return buildFallbackSlots(coachId, coachLocation);
  }

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_active', true)
    .order('starts_at', { ascending: true });

  if (error || !Array.isArray(data) || data.length === 0) {
    return buildFallbackSlots(coachId, coachLocation);
  }

  return data.map((row) => toSlot(row as Record<string, unknown>));
};

export const fetchCoachBookings = async (coachId: string): Promise<ConsultationBooking[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('consultation_bookings')
    .select('*')
    .eq('coach_id', coachId)
    .order('starts_at', { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return data.map((row) => toBooking(row as Record<string, unknown>));
};

export const fetchAthleteBookings = async (athleteId: string): Promise<ConsultationBooking[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('consultation_bookings')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('starts_at', { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return data.map((row) => toBooking(row as Record<string, unknown>));
};

const FEEDBACK_STORAGE_KEY = 'trainee-consultation-feedback';
const REMINDER_STORAGE_KEY = 'trainee-consultation-reminders';

const readJsonStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

export const saveConsultationFeedback = async (
  bookingId: string,
  rating: number,
  comment: string,
): Promise<void> => {
  const existing = readJsonStorage<Record<string, { rating: number; comment: string; createdAt: string }>>(FEEDBACK_STORAGE_KEY, {});
  existing[bookingId] = { rating, comment, createdAt: new Date().toISOString() };
  writeJsonStorage(FEEDBACK_STORAGE_KEY, existing);
};

export const getConsultationFeedback = async (bookingId: string): Promise<{ rating: number; comment: string; createdAt: string } | null> => {
  const existing = readJsonStorage<Record<string, { rating: number; comment: string; createdAt: string }>>(FEEDBACK_STORAGE_KEY, {});
  return existing[bookingId] ?? null;
};

export const saveConsultationReminder = async (bookingId: string, reminder: string): Promise<void> => {
  const existing = readJsonStorage<Record<string, { reminder: string; setAt: string }>>(REMINDER_STORAGE_KEY, {});
  existing[bookingId] = { reminder, setAt: new Date().toISOString() };
  writeJsonStorage(REMINDER_STORAGE_KEY, existing);
};

export const getConsultationReminder = async (bookingId: string): Promise<{ reminder: string; setAt: string } | null> => {
  const existing = readJsonStorage<Record<string, { reminder: string; setAt: string }>>(REMINDER_STORAGE_KEY, {});
  return existing[bookingId] ?? null;
};

export const subscribeToCoachBookings = (coachId: string, refresh: () => void) => {
  if (!supabase) return () => undefined;

  const client = supabase;
  const channel = client.channel(`coach-bookings-${coachId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'consultation_bookings', filter: `coach_id=eq.${coachId}` }, refresh)
    .subscribe();

  return () => { void client.removeChannel(channel); };
};

export const bookConsultation = async (options: {
  coachId: string;
  athleteId: string;
  athleteName: string;
  slotId?: string;
  startsAt: string;
  endsAt: string;
  format: ConsultationFormat;
  location?: string;
}): Promise<ConsultationBooking> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    coach_id: options.coachId,
    athlete_id: options.athleteId,
    athlete_name: options.athleteName,
    starts_at: options.startsAt,
    ends_at: options.endsAt,
    format: options.format,
    location: options.location ?? null,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('consultation_bookings')
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(getBookingErrorMessage(error, 'Could not create booking.'));
  }

  if (options.slotId) {
    await supabase
      .from('coach_available_slots')
      .update({ is_active: false })
      .eq('id', options.slotId);
  }

  return toBooking(data as Record<string, unknown>);
};
