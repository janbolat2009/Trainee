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

const SLOTS_STORAGE_KEY = 'trainee-coach-slots';

export const fetchCoachAvailabilitySlots = async (
  coachId: string,
  coachLocation?: string | null,
): Promise<ConsultationSlot[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('coach_available_slots')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('starts_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => toSlot(row as Record<string, unknown>));
    }
  }

  // Fallback to local storage or generated slots
  const localSlotsMap = readJsonStorage<Record<string, ConsultationSlot[]>>(SLOTS_STORAGE_KEY, {});
  const localSlots = localSlotsMap[coachId];
  if (localSlots && Array.isArray(localSlots) && localSlots.length > 0) {
    return localSlots.filter(s => s.isActive);
  }

  const fallback = buildFallbackSlots(coachId, coachLocation);
  localSlotsMap[coachId] = fallback;
  writeJsonStorage(SLOTS_STORAGE_KEY, localSlotsMap);
  return fallback;
};

export const fetchAllCoachSlots = async (
  coachId: string,
  coachLocation?: string | null,
): Promise<ConsultationSlot[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('coach_available_slots')
      .select('*')
      .eq('coach_id', coachId)
      .order('starts_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => toSlot(row as Record<string, unknown>));
    }
  }

  const localSlotsMap = readJsonStorage<Record<string, ConsultationSlot[]>>(SLOTS_STORAGE_KEY, {});
  const localSlots = localSlotsMap[coachId];
  if (localSlots && Array.isArray(localSlots)) {
    return localSlots;
  }

  const fallback = buildFallbackSlots(coachId, coachLocation);
  localSlotsMap[coachId] = fallback;
  writeJsonStorage(SLOTS_STORAGE_KEY, localSlotsMap);
  return fallback;
};

export const createCoachSlot = async (options: {
  coachId: string;
  startsAt: string;
  endsAt: string;
  format: ConsultationFormat;
  location?: string;
}): Promise<ConsultationSlot> => {
  const newSlot: ConsultationSlot = {
    id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    coachId: options.coachId,
    startsAt: options.startsAt,
    endsAt: options.endsAt,
    format: options.format,
    location: options.location ?? (options.format === 'online' ? 'Video call link provided after booking' : 'Coach physical location'),
    isActive: true,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('coach_available_slots')
      .insert({
        coach_id: options.coachId,
        starts_at: options.startsAt,
        ends_at: options.endsAt,
        format: options.format,
        location: newSlot.location,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      return toSlot(data as Record<string, unknown>);
    }
  }

  // Update local storage fallback
  const localSlotsMap = readJsonStorage<Record<string, ConsultationSlot[]>>(SLOTS_STORAGE_KEY, {});
  const current = localSlotsMap[options.coachId] ?? [];
  const updated = [...current, newSlot];
  localSlotsMap[options.coachId] = updated;
  writeJsonStorage(SLOTS_STORAGE_KEY, localSlotsMap);
  return newSlot;
};

export const updateCoachSlot = async (
  slotId: string,
  coachId: string,
  updates: Partial<Omit<ConsultationSlot, 'id' | 'coachId'>>,
): Promise<void> => {
  if (supabase && !slotId.startsWith('slot-')) {
    const payload: Record<string, unknown> = {};
    if (updates.startsAt !== undefined) payload.starts_at = updates.startsAt;
    if (updates.endsAt !== undefined) payload.ends_at = updates.endsAt;
    if (updates.format !== undefined) payload.format = updates.format;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    await supabase.from('coach_available_slots').update(payload).eq('id', slotId);
  }

  // Update local storage fallback
  const localSlotsMap = readJsonStorage<Record<string, ConsultationSlot[]>>(SLOTS_STORAGE_KEY, {});
  const current = localSlotsMap[coachId] ?? [];
  const updated = current.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
  localSlotsMap[coachId] = updated;
  writeJsonStorage(SLOTS_STORAGE_KEY, localSlotsMap);
};

export const deleteCoachSlot = async (slotId: string, coachId: string): Promise<void> => {
  if (supabase && !slotId.startsWith('slot-')) {
    await supabase.from('coach_available_slots').delete().eq('id', slotId);
  }

  const localSlotsMap = readJsonStorage<Record<string, ConsultationSlot[]>>(SLOTS_STORAGE_KEY, {});
  const current = localSlotsMap[coachId] ?? [];
  const updated = current.filter((s) => s.id !== slotId);
  localSlotsMap[coachId] = updated;
  writeJsonStorage(SLOTS_STORAGE_KEY, localSlotsMap);
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

const BOOKINGS_STORAGE_KEY = 'trainee-consultation-bookings';

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
  const newBooking: ConsultationBooking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    coachId: options.coachId,
    athleteId: options.athleteId,
    athleteName: options.athleteName,
    startsAt: options.startsAt,
    endsAt: options.endsAt,
    format: options.format,
    location: options.location ?? (options.format === 'online' ? 'Video call link provided after booking' : 'Coach location to be shared'),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (supabase) {
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

    if (!error && data) {
      if (options.slotId && !options.slotId.startsWith('slot-')) {
        await supabase
          .from('coach_available_slots')
          .update({ is_active: false })
          .eq('id', options.slotId);
      }
      // Also deactivate locally
      if (options.slotId) {
        await updateCoachSlot(options.slotId, options.coachId, { isActive: false });
      }
      return toBooking(data as Record<string, unknown>);
    }
  }

  // Deactivate slot in local storage fallback
  if (options.slotId) {
    await updateCoachSlot(options.slotId, options.coachId, { isActive: false });
  }

  // Save booking to local storage fallback
  const localBookings = readJsonStorage<ConsultationBooking[]>(BOOKINGS_STORAGE_KEY, []);
  writeJsonStorage(BOOKINGS_STORAGE_KEY, [...localBookings, newBooking]);

  return newBooking;
};
