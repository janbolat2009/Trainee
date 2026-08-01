import type { ReminderItem } from '../types';

const REMINDERS_STORAGE_KEY = 'trainee-session-reminders';

export const loadStoredReminders = (): ReminderItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReminderItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveStoredReminders = (reminders: ReminderItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // ignore storage errors
  }
};

export const parseReminderOffset = (label: string): number => {
  const normalized = label.toLowerCase();
  if (normalized.includes('15 minute')) return 15 * 60 * 1000;
  if (normalized.includes('30 minute')) return 30 * 60 * 1000;
  if (normalized.includes('1 hour')) return 60 * 60 * 1000;
  if (normalized.includes('1 day')) return 24 * 60 * 60 * 1000;
  if (normalized.includes('5 minute')) return 5 * 60 * 1000;
  return 15 * 60 * 1000;
};

export const buildSessionReminders = (options: {
  bookingId: string;
  startsAt: string;
  athleteTitle: string;
  coachTitle: string;
  athleteMessage: string;
  coachMessage: string;
  offsets?: { idSuffix: string; msBefore: number; athleteTitle: string; coachTitle: string; athleteMessage: string; coachMessage: string }[];
}): ReminderItem[] => {
  const startMs = new Date(options.startsAt).getTime();
  const defaultOffsets = options.offsets ?? [
    {
      idSuffix: '15min',
      msBefore: 15 * 60 * 1000,
      athleteTitle: options.athleteTitle,
      coachTitle: options.coachTitle,
      athleteMessage: options.athleteMessage,
      coachMessage: options.coachMessage,
    },
    {
      idSuffix: '5min',
      msBefore: 5 * 60 * 1000,
      athleteTitle: 'Starting soon',
      coachTitle: 'Session starting soon',
      athleteMessage: 'Your session starts in 5 minutes. Join when ready.',
      coachMessage: 'Your athlete session starts in 5 minutes.',
    },
  ];

  const reminders: ReminderItem[] = [];

  for (const offset of defaultOffsets) {
    const scheduledFor = new Date(startMs - offset.msBefore).toISOString();
    reminders.push(
      {
        id: `reminder-${options.bookingId}-athlete-${offset.idSuffix}`,
        bookingId: options.bookingId,
        title: offset.athleteTitle,
        message: offset.athleteMessage,
        scheduledFor,
        status: 'scheduled',
        isUnread: true,
        joinUrl: '/meeting',
        audience: 'athlete',
      },
      {
        id: `reminder-${options.bookingId}-coach-${offset.idSuffix}`,
        bookingId: options.bookingId,
        title: offset.coachTitle,
        message: offset.coachMessage,
        scheduledFor,
        status: 'scheduled',
        isUnread: true,
        joinUrl: '/meeting',
        audience: 'coach',
      },
    );
  }

  return reminders;
};
