import type { CoachListing, ListingApplication, ApplicationStatus, ListingStatus } from '../types';
import { supabase } from '../lib/supabase';
import { getOrCreateConversation, sendMessage } from './chatService';

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v : fallback;

const normalizeListingRow = (row: Row): CoachListing => ({
  id: str(row.id, ''),
  coachId: str(row.coach_id),
  sport: str(row.sport),
  specialization: str(row.specialization),
  athleteLevel: str(row.athlete_level, 'Any'),
  trainingFormat: (str(row.training_format, 'online')) as CoachListing['trainingFormat'],
  price: typeof row.price === 'number' ? row.price : 0,
  billingPeriod: (str(row.billing_period, 'session')) as CoachListing['billingPeriod'],
  description: str(row.description),
  coachingStyle: str(row.coaching_style),
  achievements: Array.isArray(row.achievements) ? (row.achievements as string[]) : [],
  location: typeof row.location === 'string' ? row.location : null,
  mediaUrls: Array.isArray(row.media_urls) ? (row.media_urls as string[]) : [],
  status: (str(row.status, 'active')) as ListingStatus,
  createdAt: str(row.created_at),
});

const normalizeApplicationRow = (row: Row): ListingApplication => ({
  id: str(row.id, ''),
  listingId: str(row.listing_id),
  coachId: str(row.coach_id),
  athleteId: str(row.athlete_id),
  athleteName: str(row.athlete_name, 'Athlete'),
  athleteAvatar: typeof row.athlete_avatar === 'string' ? row.athlete_avatar : null,
  message: str(row.message),
  status: (str(row.status, 'pending')) as ApplicationStatus,
  createdAt: str(row.created_at),
});

// ── Listings ─────────────────────────────────────────────────────────────────

export const fetchCoachListings = async (coachProfileId: string): Promise<CoachListing[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('coach_listings')
    .select('*')
    .eq('coach_id', coachProfileId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchCoachListings:', error.message); return []; }
  return (data ?? []).map((r) => normalizeListingRow(r as Row));
};

export const fetchActiveListings = async (): Promise<CoachListing[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('coach_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchActiveListings:', error.message); return []; }
  return (data ?? []).map((r) => normalizeListingRow(r as Row));
};

export type CreateListingPayload = Omit<CoachListing, 'id' | 'createdAt'>;

export const createListing = async (coachProfileId: string, payload: Omit<CreateListingPayload, 'coachId'>): Promise<CoachListing | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('coach_listings')
    .insert({
      coach_id: coachProfileId,
      sport: payload.sport,
      specialization: payload.specialization,
      athlete_level: payload.athleteLevel,
      training_format: payload.trainingFormat,
      price: payload.price,
      billing_period: payload.billingPeriod,
      description: payload.description,
      coaching_style: payload.coachingStyle,
      achievements: payload.achievements,
      location: payload.location,
      media_urls: payload.mediaUrls,
      status: payload.status,
    })
    .select()
    .single();
  if (error) { console.error('createListing:', error.message); return null; }
  return normalizeListingRow(data as Row);
};

export const updateListing = async (listingId: string, updates: Partial<Omit<CoachListing, 'id' | 'coachId' | 'createdAt'>>): Promise<boolean> => {
  if (!supabase) return false;
  const dbUpdates: Record<string, unknown> = {};
  if (updates.sport !== undefined) dbUpdates.sport = updates.sport;
  if (updates.specialization !== undefined) dbUpdates.specialization = updates.specialization;
  if (updates.athleteLevel !== undefined) dbUpdates.athlete_level = updates.athleteLevel;
  if (updates.trainingFormat !== undefined) dbUpdates.training_format = updates.trainingFormat;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.billingPeriod !== undefined) dbUpdates.billing_period = updates.billingPeriod;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.coachingStyle !== undefined) dbUpdates.coaching_style = updates.coachingStyle;
  if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.mediaUrls !== undefined) dbUpdates.media_urls = updates.mediaUrls;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase.from('coach_listings').update(dbUpdates).eq('id', listingId);
  if (error) { console.error('updateListing:', error.message); return false; }
  return true;
};

export const deleteListing = async (listingId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('coach_listings').delete().eq('id', listingId);
  if (error) { console.error('deleteListing:', error.message); return false; }
  return true;
};

// ── Applications ─────────────────────────────────────────────────────────────

export const fetchCoachApplications = async (coachProfileId: string): Promise<ListingApplication[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listing_applications')
    .select('*')
    .eq('coach_id', coachProfileId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchCoachApplications:', error.message); return []; }
  return (data ?? []).map((r) => normalizeApplicationRow(r as Row));
};

export const fetchAthleteApplications = async (athleteProfileId: string): Promise<ListingApplication[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('listing_applications')
    .select('*')
    .eq('athlete_id', athleteProfileId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAthleteApplications:', error.message); return []; }
  return (data ?? []).map((r) => normalizeApplicationRow(r as Row));
};

export const applyToListing = async (
  listingId: string,
  coachId: string,
  athleteProfileId: string,
  athleteName: string,
  athleteAvatar: string | null,
  message: string,
): Promise<boolean> => {
  if (!supabase) return false;

  // 1. Save Application
  const { data: appData, error } = await supabase
    .from('listing_applications')
    .insert({
      listing_id: listingId,
      coach_id: coachId,
      athlete_id: athleteProfileId,
      athlete_name: athleteName,
      athlete_avatar: athleteAvatar,
      message,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !appData) {
    console.error('applyToListing error:', error?.message);
    return false;
  }

  // 2. Automatically Create Chat Conversation between Athlete & Coach
  try {
    const conv = await getOrCreateConversation(
      athleteProfileId,
      coachId,
      listingId,
      str(appData.id)
    );
    if (conv && message.trim()) {
      await sendMessage(conv.id, athleteProfileId, message.trim());
    }
  } catch (convErr) {
    console.error('Auto conversation creation error:', convErr);
  }

  return true;
};

export const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('listing_applications').update({ status }).eq('id', applicationId);
  if (error) { console.error('updateApplicationStatus:', error.message); return false; }
  return true;
};
