import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'leave' | 'join';
  senderId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface SignalingChannel {
  send: (message: Omit<SignalMessage, 'senderId'>) => void;
  cleanup: () => void;
}

export const createSignalingChannel = (
  meetingId: string,
  userId: string,
  onMessage: (message: SignalMessage) => void,
): SignalingChannel | null => {
  const client = supabase;
  if (!client) return null;

  const channelName = `webrtc-signaling-${meetingId}`;
  const channel: RealtimeChannel = client.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  channel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
    const message = payload as SignalMessage;
    if (!message?.type || message.senderId === userId) return;
    onMessage(message);
  });

  void channel.subscribe();

  return {
    send: (message) => {
      void channel.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: { ...message, senderId: userId } satisfies SignalMessage,
      });
    },
    cleanup: () => {
      void client.removeChannel(channel);
    },
  };
};
