import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Loader2, Wifi, WifiOff, Users } from 'lucide-react';
import type { ConsultationBooking } from '../../types';

interface VideoMeetingModalProps {
  booking: ConsultationBooking | null;
  onClose: () => void;
}

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'leave';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const getSignalChannelName = (meetingId: string) => `apexlink-webrtc-${meetingId}`;

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const VideoMeetingModal: React.FC<VideoMeetingModalProps> = ({ booking, onClose }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const offerSentRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!booking) return undefined;

    let isMounted = true;
    const channel = new BroadcastChannel(getSignalChannelName(booking.id));
    channelRef.current = channel;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Your browser does not support camera and microphone access.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) return;

        streamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          const [remote] = event.streams;
          if (remote) {
            setRemoteStream(remote);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
          }
        };

        pc.onconnectionstatechange = () => {
          if (!pc.connectionState) return;
          if (pc.connectionState === 'connected') {
            setConnectionState('connected');
            setIsLoading(false);
          } else if (pc.connectionState === 'connecting') {
            setConnectionState('connecting');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionState('reconnecting');
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.postMessage({ type: 'candidate', candidate: event.candidate.toJSON() });
          }
        };

        channel.onmessage = async (event: MessageEvent<SignalMessage>) => {
          const message = event.data;
          if (!message || !pc) return;

          try {
            if (message.type === 'offer' && message.offer) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.postMessage({ type: 'answer', answer });
              setConnectionState('connecting');
            } else if (message.type === 'answer' && message.answer) {
              await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
              setConnectionState('connecting');
            } else if (message.type === 'candidate' && message.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            } else if (message.type === 'leave') {
              setConnectionState('disconnected');
            }
          } catch (error) {
            console.error('WebRTC signal error', error);
            setConnectionState('reconnecting');
          }
        };

        if (!offerSentRef.current) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.postMessage({ type: 'offer', offer });
          offerSentRef.current = true;
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setConnectionState('disconnected');
      }
    };

    void start();

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      channel.close();
      channelRef.current = null;
      offerSentRef.current = false;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [booking?.id]);

  const participantLabel = useMemo(() => {
    if (!booking) return 'Meeting';
    return `${booking.athleteName} • Coach`;
  }, [booking]);

  const toggleMic = () => {
    const tracks = localStream?.getAudioTracks() ?? [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicMuted((value) => !value);
  };

  const toggleCamera = () => {
    const tracks = localStream?.getVideoTracks() ?? [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((value) => !value);
  };

  const toggleScreenShare = async () => {
    if (!localStream || !peerConnectionRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find((entry) => entry.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
      setIsScreenSharing(true);
      screenTrack.addEventListener('ended', () => {
        setIsScreenSharing(false);
      }, { once: true });
      const currentTrack = localStream.getVideoTracks()[0];
      if (currentTrack) currentTrack.stop();
      setLocalStream((prev) => prev ? new MediaStream([screenTrack, ...(prev.getAudioTracks() ?? [])]) : null);
    } catch (error) {
      console.error(error);
    }
  };

  const leaveMeeting = () => {
    channelRef.current?.postMessage({ type: 'leave' });
    onClose();
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0f17] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-accent">Secure meeting room</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{participantLabel}</h2>
            <p className="mt-1 text-sm text-zinc-400">A built-in WebRTC session for performance reviews, technical feedback, and consultation prep.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-dark/80 px-3 py-2 text-xs text-zinc-300">
            {connectionState === 'connected' ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-amber-400" />}
            <span className="capitalize">{connectionState}</span>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-brand-dark">
            <video ref={remoteVideoRef} autoPlay playsInline muted className="h-[420px] w-full object-cover" />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-dark to-[#080a10]">
                <div className="text-center">
                  {isLoading ? (
                    <div className="mb-3 flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
                    </div>
                  ) : (
                    <Users className="mx-auto mb-3 h-8 w-8 text-brand-accent" />
                  )}
                  <p className="text-sm text-zinc-300">{isLoading ? 'Connecting to the session...' : 'Waiting for the other participant to join.'}</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-200">
              {formatDuration(elapsedSeconds)} • {booking.format === 'online' ? 'Video call' : 'Consultation'}
            </div>
            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-200">
              {booking.athleteName}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-brand-dark p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">Local preview</p>
                  <p className="mt-1 text-sm font-semibold text-white">Your camera and microphone</p>
                </div>
                <div className="rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2.5 py-1 text-[10px] font-semibold text-brand-accent">
                  Ready
                </div>
              </div>
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/70">
                <video ref={localVideoRef} autoPlay playsInline muted className="h-48 w-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleMic} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                {isMicMuted ? <MicOff className="mr-2 inline h-4 w-4" /> : <Mic className="mr-2 inline h-4 w-4" />}
                {isMicMuted ? 'Unmute mic' : 'Mute mic'}
              </button>
              <button onClick={toggleCamera} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                {isCameraOff ? <CameraOff className="mr-2 inline h-4 w-4" /> : <Camera className="mr-2 inline h-4 w-4" />}
                {isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              </button>
              <button onClick={toggleScreenShare} className="rounded-2xl border border-brand-border bg-brand-dark/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                <MonitorUp className="mr-2 inline h-4 w-4" />
                Share screen
              </button>
              <button onClick={leaveMeeting} className="rounded-2xl border border-rose-500/30 bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/22">
                <PhoneOff className="mr-2 inline h-4 w-4" />
                Leave
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
