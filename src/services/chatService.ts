import type { Conversation, DirectMessage } from '../types';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v : fallback;

const normalizeMessage = (row: Row): DirectMessage => ({
  id: str(row.id),
  conversationId: str(row.conversation_id),
  senderId: str(row.sender_id),
  text: str(row.text),
  isRead: Boolean(row.is_read),
  createdAt: str(row.created_at),
});

// ── Get or Create Conversation between 2 Profile IDs ───────────────────────────

export const getOrCreateConversation = async (
  currentProfileId: string,
  targetProfileId: string,
  listingId?: string,
  applicationId?: string
): Promise<Conversation | null> => {
  if (!supabase) return null;
  const client = supabase;

  // 1. Search for an existing conversation between these two profiles
  const { data: existing, error: searchError } = await client
    .from('conversations')
    .select('*')
    .or(
      `and(participant_1.eq.${currentProfileId},participant_2.eq.${targetProfileId}),and(participant_1.eq.${targetProfileId},participant_2.eq.${currentProfileId})`
    )
    .limit(1);

  if (!searchError && existing && existing.length > 0) {
    const row = existing[0] as Row;
    return {
      id: str(row.id),
      listingId: typeof row.listing_id === 'string' ? row.listing_id : null,
      applicationId: typeof row.application_id === 'string' ? row.application_id : null,
      participant1: str(row.participant_1),
      participant2: str(row.participant_2),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
    };
  }

  // 2. Insert new conversation if non-existent
  const { data: inserted, error: insertError } = await client
    .from('conversations')
    .insert({
      participant_1: currentProfileId,
      participant_2: targetProfileId,
      listing_id: listingId ?? null,
      application_id: applicationId ?? null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('getOrCreateConversation insert error:', insertError.message);
    return null;
  }

  const row = inserted as Row;
  return {
    id: str(row.id),
    listingId: typeof row.listing_id === 'string' ? row.listing_id : null,
    applicationId: typeof row.application_id === 'string' ? row.application_id : null,
    participant1: str(row.participant_1),
    participant2: str(row.participant_2),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
};

// ── Fetch Conversations for current profile with last message & participant details

export const fetchUserConversations = async (currentProfileId: string): Promise<Conversation[]> => {
  if (!supabase) return [];
  const client = supabase;

  const { data: convs, error } = await client
    .from('conversations')
    .select('*')
    .or(`participant_1.eq.${currentProfileId},participant_2.eq.${currentProfileId}`)
    .order('updated_at', { ascending: false });

  if (error || !convs) {
    console.error('fetchUserConversations error:', error?.message);
    return [];
  }

  // Fetch target profiles for participant metadata
  const targetIds = convs.map((c) => (c.participant_1 === currentProfileId ? c.participant_2 : c.participant_1));
  const uniqueTargetIds = Array.from(new Set(targetIds));

  let profileMap: Record<string, { id: string; name: string; avatar: string | null; role: any }> = {};

  if (uniqueTargetIds.length > 0) {
    const { data: profs } = await client
      .from('profiles')
      .select('id, name, avatar, role')
      .in('id', uniqueTargetIds);

    if (profs) {
      profs.forEach((p) => {
        profileMap[p.id] = {
          id: p.id,
          name: p.name ?? 'User',
          avatar: p.avatar ?? null,
          role: p.role ?? 'athlete',
        };
      });
    }
  }

  // Fetch last messages & unread counts for each conversation
  const results: Conversation[] = await Promise.all(
    convs.map(async (c) => {
      const otherId = c.participant_1 === currentProfileId ? c.participant_2 : c.participant_1;
      const otherUser = profileMap[otherId] ?? { id: otherId, name: 'User', avatar: null, role: 'athlete' };

      // Fetch last message
      const { data: lastMsgs } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Fetch unread count
      const { count } = await client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .eq('is_read', false)
        .neq('sender_id', currentProfileId);

      const lastMsg = lastMsgs && lastMsgs.length > 0 ? normalizeMessage(lastMsgs[0] as Row) : undefined;

      return {
        id: str(c.id),
        listingId: typeof c.listing_id === 'string' ? c.listing_id : null,
        applicationId: typeof c.application_id === 'string' ? c.application_id : null,
        participant1: str(c.participant_1),
        participant2: str(c.participant_2),
        createdAt: str(c.created_at),
        updatedAt: str(c.updated_at),
        otherUser,
        lastMessage: lastMsg,
        unreadCount: count ?? 0,
      };
    })
  );

  return results;
};

// ── Fetch Messages in a Conversation ─────────────────────────────────────────

export const fetchConversationMessages = async (conversationId: string): Promise<DirectMessage[]> => {
  if (!supabase) return [];
  const client = supabase;

  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchConversationMessages error:', error.message);
    return [];
  }

  return (data ?? []).map((r) => normalizeMessage(r as Row));
};

// ── Send Message ──────────────────────────────────────────────────────────────

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string
): Promise<DirectMessage | null> => {
  if (!supabase || !text.trim()) return null;
  const client = supabase;

  const { data, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text: text.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('sendMessage error:', error.message);
    return null;
  }

  // Touch conversation updated_at
  await client
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return normalizeMessage(data as Row);
};

// ── Mark Messages as Read ─────────────────────────────────────────────────────

export const markMessagesAsRead = async (conversationId: string, currentProfileId: string): Promise<void> => {
  if (!supabase) return;
  const client = supabase;

  await client
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentProfileId)
    .eq('is_read', false);
};

// ── Supabase Realtime Subscription for Messages ────────────────────────────────

export const subscribeToConversationMessages = (
  conversationId: string,
  onNewMessage: (msg: DirectMessage) => void
): RealtimeChannel | null => {
  if (!supabase) return null;
  const client = supabase;

  const channel = client
    .channel(`chat-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = normalizeMessage(payload.new as Row);
        onNewMessage(msg);
      }
    )
    .subscribe();

  return channel;
};

export const unsubscribeChatChannel = (channel: RealtimeChannel | null) => {
  if (!supabase || !channel) return;
  void supabase.removeChannel(channel);
};
